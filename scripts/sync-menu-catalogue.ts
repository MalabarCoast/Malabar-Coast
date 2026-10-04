import {createClient} from '@sanity/client'
import {menuAllergenEvidence, menuCategories, menuItems} from '../app/lib/menu'

try {
  process.loadEnvFile?.('.env.local')
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

const apply = process.argv.includes('--apply')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const token = process.env.SANITY_API_TOKEN?.trim()

if (!projectId || !token) throw new Error('Sanity project configuration and SANITY_API_TOKEN are required.')

const client = createClient({projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw'})

const retiredSourceKeys = [
  'clay-oven-masala-chicken-tikka',
  'clay-oven-masala-lamb',
  'beef-beef-chasni',
  'beef-beef-jalfrezi',
  'vegetarian-cherupayar-curry',
] as const

type ExistingCategory = {_id: string; slug?: string}
type ExistingItem = {
  _id: string
  sourceKey?: string
  allergens?: string[]
  allergenReviewStatus?: 'confirmed' | 'confirmed-none' | 'needs-review'
  dietaryReviewStatus?: 'confirmed' | 'needs-review'
}

async function main() {
  const [existingCategories, existingItems, inactiveTestItems] = await Promise.all([
    client.fetch<ExistingCategory[]>(`*[_type == "menuCategory"]{_id,"slug":slug.current}`),
    client.fetch<ExistingItem[]>(`*[_type == "menuItem" && defined(sourceKey)]{_id,sourceKey,allergens,allergenReviewStatus,dietaryReviewStatus}`),
    client.fetch<Array<{_id: string; name?: string}>>(`*[_type == "menuItem" && name == "Gautham Krishna"]{_id,name}`),
  ])
  const categoryBySlug = new Map(existingCategories.filter((entry) => entry.slug).map((entry) => [entry.slug!, entry]))
  const itemBySourceKey = new Map(existingItems.filter((entry) => entry.sourceKey).map((entry) => [entry.sourceKey!, entry]))
  const missingCategories = menuCategories.filter((category) => !categoryBySlug.has(category.slug))
  const missingItems = menuItems.filter((item) => !itemBySourceKey.has(item.id))
  const protectedAllergenDeclarations = existingItems.filter((item) => {
    const status = item.allergenReviewStatus ?? (item.dietaryReviewStatus === 'confirmed' && item.allergens?.length ? 'confirmed' : 'needs-review')
    return status !== 'needs-review'
  }).length

  if (!apply) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      source: 'docs/Malabar_Coast_Full_Menu_Updated.pdf',
      categories: menuCategories.length,
      catalogueItems: menuItems.length,
      categoriesToCreate: missingCategories.map((category) => category.slug),
      itemsToCreate: missingItems.map((item) => item.id),
      itemsToUpdate: menuItems.length - missingItems.length,
      itemsToRetire: retiredSourceKeys.filter((sourceKey) => itemBySourceKey.has(sourceKey)),
      protectedAllergenDeclarations,
      inactiveTestItemsToSecure: inactiveTestItems.map((item) => item._id),
      sourceAllergenDeclarations: menuItems.filter((item) => item.allergenReviewStatus === 'confirmed').length,
      allergenSafety: 'Only the owner-supplied D/N/G markers are applied. Existing declarations on unmarked items are preserved.',
    }, null, 2))
    return
  }

  const categoryIds = new Map<string, string>()
  for (const category of menuCategories) {
    const document = {
      title: category.title,
      slug: {_type: 'slug', current: category.slug},
      shortTitle: category.note,
      eyebrow: category.note,
      description: category.description,
      orderRank: category.orderRank,
      published: true,
    }
    const existing = categoryBySlug.get(category.slug)
    if (existing) {
      await client.patch(existing._id).set(document).commit()
      categoryIds.set(category.slug, existing._id)
    } else {
      const created = await client.create({_type: 'menuCategory', ...document})
      categoryIds.set(category.slug, created._id)
    }
  }

  let transaction = client.transaction()
  for (const item of menuItems) {
    const categoryId = categoryIds.get(item.category)
    if (!categoryId) throw new Error(`Category reference missing for ${item.id}`)
    const core = {
      published: true,
      name: item.name,
      slug: {_type: 'slug', current: item.id},
      sourceKey: item.id,
      category: {_type: 'reference', _ref: categoryId},
      description: item.description,
      subheading: item.subheading,
      pricePence: item.isAlcoholic ? null : item.pricePence,
      priceLabel: item.priceLabel,
      hidePrice: item.isAlcoholic || item.hidePrice,
      isAlcoholic: item.isAlcoholic,
      available: item.available,
      onlineOrdering: item.onlineOrdering,
      featured: item.featured,
      displayOrder: item.displayOrder,
    }
    const existing = itemBySourceKey.get(item.id)
    const sourceAllergenDeclaration = item.allergenReviewStatus === 'confirmed' && item.allergens.length > 0
      ? {
          allergens: item.allergens,
          allergenReviewStatus: 'confirmed' as const,
          allergenNotes: item.allergenNotes,
          allergenSource: menuAllergenEvidence.source,
          allergenReviewedBy: menuAllergenEvidence.reviewedBy,
          allergenReviewedAt: menuAllergenEvidence.reviewedAt,
        }
      : null
    if (existing) {
      const inheritedReviewStatus = existing.allergenReviewStatus
        ?? (existing.dietaryReviewStatus === 'confirmed' && existing.allergens?.length ? 'confirmed' : 'needs-review')
      transaction = transaction.patch(existing._id, {
        set: {...core, ...(sourceAllergenDeclaration || {})},
        ...(sourceAllergenDeclaration ? {} : {
          setIfMissing: {
            allergenReviewStatus: inheritedReviewStatus,
          },
        }),
      })
    } else {
      transaction = transaction.create({
        _type: 'menuItem',
        ...core,
        isVegetarian: item.dietaryStatus === 'vegetarian' || item.dietaryStatus === 'vegan',
        isVegan: item.dietaryStatus === 'vegan',
        dietaryReviewStatus: 'needs-review',
        dietaryNotes: item.dietaryStatus === 'notApplicable'
          ? 'Dietary label not applicable.'
          : 'Classification inferred from the supplied menu name; the restaurant must confirm the current recipe.',
        allergens: sourceAllergenDeclaration?.allergens || [],
        allergenReviewStatus: sourceAllergenDeclaration?.allergenReviewStatus || 'needs-review',
        ...(sourceAllergenDeclaration || {}),
        spiceLevel: 'none',
      })
    }
  }
  for (const sourceKey of retiredSourceKeys) {
    const existing = itemBySourceKey.get(sourceKey)
    if (existing) transaction = transaction.patch(existing._id, {set: {published: false, available: false, onlineOrdering: false}})
  }
  for (const testItem of inactiveTestItems) {
    transaction = transaction.patch(testItem._id, {set: {published: false, available: false, onlineOrdering: false}})
  }
  await transaction.commit()

  const verification = await client.fetch<Array<{
    sourceKey: string
    name?: string
    published?: boolean
    category?: string
    pricePence?: number | null
    allergenReviewStatus?: string
    allergens?: string[]
    allergenSource?: string
  }>>(`*[_type == "menuItem" && sourceKey in $sourceKeys]{sourceKey,name,published,"category":category->slug.current,pricePence,allergenReviewStatus,allergens,allergenSource}`, {
    sourceKeys: [...menuItems.map((item) => item.id), ...retiredSourceKeys],
  })
  const verifiedByKey = new Map(verification.map((item) => [item.sourceKey, item]))
  const missingAfterApply = menuItems.filter((item) => !verifiedByKey.has(item.id)).map((item) => item.id)
  const mismatches = menuItems.filter((item) => {
    const saved = verifiedByKey.get(item.id)
    return !saved || saved.name !== item.name || saved.published !== true || saved.category !== item.category || saved.pricePence !== (item.isAlcoholic ? null : item.pricePence)
  }).map((item) => item.id)
  const allergenMismatches = menuItems.filter((item) => {
    if (item.allergenReviewStatus !== 'confirmed') return false
    const saved = verifiedByKey.get(item.id)
    return saved?.allergenReviewStatus !== 'confirmed'
      || JSON.stringify(saved.allergens || []) !== JSON.stringify(item.allergens)
      || saved.allergenSource !== menuAllergenEvidence.source
  }).map((item) => item.id)
  const stillPublished = retiredSourceKeys.filter((sourceKey) => verifiedByKey.get(sourceKey)?.published !== false)
  if (missingAfterApply.length || mismatches.length || allergenMismatches.length || stillPublished.length) {
    throw new Error(`Menu verification failed. Missing: ${missingAfterApply.join(', ') || 'none'}; mismatched: ${mismatches.join(', ') || 'none'}; allergen mismatches: ${allergenMismatches.join(', ') || 'none'}; retired still published: ${stillPublished.join(', ') || 'none'}`)
  }

  console.log(JSON.stringify({
    mode: 'applied-and-verified',
    source: 'docs/Malabar_Coast_Full_Menu_Updated.pdf',
    categories: menuCategories.length,
    catalogueItems: menuItems.length,
    createdItems: missingItems.length,
    updatedItems: menuItems.length - missingItems.length,
    retiredItems: retiredSourceKeys.length,
    protectedAllergenDeclarations,
    sourceAllergenDeclarations: menuItems.filter((item) => item.allergenReviewStatus === 'confirmed').length,
    inactiveTestItemsSecured: inactiveTestItems.length,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Menu catalogue sync failed.')
  process.exit(1)
})
