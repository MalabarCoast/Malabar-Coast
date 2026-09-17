import {createReadStream, existsSync} from 'node:fs'
import {basename, join} from 'node:path'
import {createClient} from '@sanity/client'

const apply = process.argv.includes('--apply')
const skipImageUpload = process.argv.includes('--skip-image-upload')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const token = process.env.SANITY_API_TOKEN?.trim()

if (!projectId || !token) throw new Error('Sanity project configuration and SANITY_API_TOKEN are required.')

const client = createClient({projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw'})
const publicDirectory = join(process.cwd(), 'public')

const definitions = [
  {key: 'delhi', sourceKey: 'clay-oven-chicken-tikka', area: 'Delhi', region: 'North India', coordinates: '28.6139° N · 77.2090° E', yearLabel: 'Capital tandoor', courseLabel: 'Chicken tikka', imageFile: 'menu/chicken-tikka.png', alt: 'Charred chicken tikka inspired by Delhi’s tandoor kitchens', description: 'Tender yoghurt-spiced chicken, charred in the tandoor for smoky edges and a juicy centre.'},
  {key: 'amritsar', sourceKey: 'clay-oven-tandoori-chicken', area: 'Amritsar', region: 'Punjab', coordinates: '31.6340° N · 74.8723° E', yearLabel: 'Punjab fire', courseLabel: 'Tandoori chicken', imageFile: 'menu/tandoori-chicken.png', alt: 'Bone-in tandoori chicken inspired by Amritsar', description: 'Bone-in chicken marinated with yoghurt and warm spices, then roasted over fierce tandoor heat.'},
  {key: 'mumbai', sourceKey: 'clay-oven-chicken-shashlik', area: 'Mumbai (Bombay)', region: 'Western India', coordinates: '19.0760° N · 72.8777° E', yearLabel: 'City grill', courseLabel: 'Chicken shashlik', imageFile: 'menu/chicken-shashlik.png', alt: 'Chicken shashlik with peppers and onion inspired by Mumbai', description: 'Tandoor-grilled chicken, peppers and onion layered on skewers with a bright, smoky finish.'},
  {key: 'kashmir', sourceKey: 'clay-oven-lamb-tikka', area: 'Kashmir', region: 'Himalayan north', coordinates: '34.0837° N · 74.7973° E', yearLabel: 'Mountain spice', courseLabel: 'Lamb tikka', imageFile: 'menu/lamb-tikka.png', alt: 'Aromatic lamb tikka inspired by Kashmir', description: 'Boneless lamb steeped in aromatic spices and cooked in the tandoor until tender and lightly charred.'},
  {key: 'hyderabad', sourceKey: 'biriyani-chicken', area: 'Hyderabad', region: 'Deccan', coordinates: '17.3850° N · 78.4867° E', yearLabel: 'Dum kitchen', courseLabel: 'Chicken biriyani', imageFile: 'menu/chicken-biriyani.png', alt: 'Fragrant chicken biriyani inspired by Hyderabad', description: 'Fragrant basmati rice layered with spiced chicken and slow-cooked together in the dum style.'},
  {key: 'lucknow', sourceKey: 'desserts-gulab-jamun', area: 'Lucknow', region: 'Awadh', coordinates: '26.8467° N · 80.9462° E', yearLabel: 'Festive finish', courseLabel: 'Gulab jamun', imageFile: 'menu/gulab-jamun.png', alt: 'Gulab jamun in cardamom and saffron syrup', description: 'Soft golden milk dumplings soaked in fragrant cardamom and saffron syrup.'},
] as const

const additionalDescriptions = [
  {sourceKey: 'malabar-coast-signature-konju-coconut-fry', description: 'Prawns tossed with toasted coconut, curry leaves and Malabar spices for a dry, savoury finish.'},
  {sourceKey: 'malabar-coast-signature-aattirachi-kurumulak', description: 'Slow-cooked lamb layered with cracked black pepper, shallots and curry leaves.'},
] as const

const baseUpdate = {
  eyebrow: 'A taste of India · Coast to mountains',
  headingLineOne: 'Six places.',
  headingLineTwo: 'One table.',
  introduction: 'Travel from Delhi and Amritsar’s tandoor fire to Mumbai’s grills, Kashmir’s aromatic lamb, Hyderabad’s biriyani and Lucknow’s festive sweets.',
  journeyLinkLabel: 'Explore India',
}

function block(text: string) {
  return [{_type: 'block', _key: 'menu-copy', style: 'normal', markDefs: [], children: [{_type: 'span', _key: 'menu-copy-text', text, marks: []}]}]
}

async function uploadImage(relativePath: string) {
  const absolutePath = join(publicDirectory, relativePath)
  if (!existsSync(absolutePath)) throw new Error(`Missing website image: ${relativePath}`)
  const filename = basename(relativePath)
  const existingId = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`, {filename})
  if (existingId) return existingId
  const asset = await client.assets.upload('image', createReadStream(absolutePath), {filename})
  return asset._id
}

async function main() {
  const sourceKeys = [...definitions.map((definition) => definition.sourceKey), ...additionalDescriptions.map((definition) => definition.sourceKey)]
  const [pages, dishes, homePageId, siteSettingsId] = await Promise.all([
    client.fetch<Array<{_id: string; voyageStops?: Array<{_key?: string}>}>>(`*[_id in ["menuPage", "drafts.menuPage"]]{_id,voyageStops[]{_key}}`),
    client.fetch<Array<{_id: string; sourceKey: string; image?: {_type: 'image'; asset?: {_type: 'reference'; _ref: string}; alt?: string}}>>(
      `*[_type == "menuItem" && sourceKey in $sourceKeys]{_id,sourceKey,image}`,
      {sourceKeys},
    ),
    client.fetch<string | null>(`*[_type == "marketingPage" && pageKey == "home"][0]._id`),
    client.fetch<string | null>(`*[_type == "siteSettings"][0]._id`),
  ])

  if (!pages.some((page) => page._id === 'menuPage')) throw new Error('The published menuPage singleton does not exist.')
  const dishByKey = new Map(dishes.map((dish) => [dish.sourceKey, dish._id]))
  const dishRecordByKey = new Map(dishes.map((dish) => [dish.sourceKey, dish]))
  const missing = sourceKeys.filter((sourceKey) => !dishByKey.has(sourceKey))
  if (missing.length) throw new Error(`Missing menu dishes: ${missing.join(', ')}`)

  if (!apply) {
    console.log(JSON.stringify({mode: 'dry-run', imageMode: skipImageUpload ? 'reuse-existing' : 'upload', documents: pages.map((page) => page._id), headings: [baseUpdate.headingLineOne, baseUpdate.headingLineTwo], areas: definitions.map((stop) => stop.area), dishDescriptions: sourceKeys}, null, 2))
    return
  }

  const assetIds = skipImageUpload
    ? definitions.map(() => null)
    : await Promise.all(definitions.map((definition) => uploadImage(definition.imageFile)))
  const journeyImage = (definition: (typeof definitions)[number], index: number) => {
    const uploadedAssetId = assetIds[index]
    if (uploadedAssetId) {
      return {_type: 'image', asset: {_type: 'reference', _ref: uploadedAssetId}, alt: definition.alt}
    }
    const existingImage = dishRecordByKey.get(definition.sourceKey)?.image
    return existingImage?.asset?._ref
      ? {...existingImage, alt: definition.alt}
      : undefined
  }
  const createVoyageStops = (oldStops: Array<{_key?: string}> = []) => definitions.map((definition, index) => ({
    _key: oldStops[index]?._key || definition.key,
    _type: 'object',
    dish: {_type: 'reference', _ref: dishByKey.get(definition.sourceKey)},
    area: definition.area,
    region: definition.region,
    coordinates: definition.coordinates,
    yearLabel: definition.yearLabel,
    courseLabel: definition.courseLabel,
    description: definition.description,
    ...(journeyImage(definition, index) ? {image: journeyImage(definition, index)} : {}),
  }))

  let transaction = client.transaction()
  for (const page of pages) transaction = transaction.patch(page._id, {set: {...baseUpdate, voyageStops: createVoyageStops(page.voyageStops)}})
  for (const [index, definition] of definitions.entries()) {
    const uploadedAssetId = assetIds[index]
    transaction = transaction.patch(dishByKey.get(definition.sourceKey)!, {set: {
      description: definition.description,
      ...(uploadedAssetId ? {image: {_type: 'image', asset: {_type: 'reference', _ref: uploadedAssetId}, alt: definition.alt}} : {}),
      featured: definition.sourceKey === 'clay-oven-chicken-tikka' || definition.sourceKey === 'desserts-gulab-jamun',
    }})
  }
  for (const definition of additionalDescriptions) transaction = transaction.patch(dishByKey.get(definition.sourceKey)!, {set: {description: definition.description}})
  if (homePageId) transaction = transaction.patch(homePageId, {set: {
    eyebrow: 'Indian Cuisine & Bar · Holytown',
    heroText: 'Tandoor fire, fragrant biriyani, rich curries and Malabar coastal flavours, served with a full bar in the heart of Holytown.',
    'sections[_key=="home-menu"].eyebrow': 'From coast and tandoor',
    'sections[_key=="home-menu"].body': block('From tandoor-charred Chicken Tikka to coconut-rich coastal plates and slow-cooked lamb, our table travels across India.'),
  }})
  if (siteSettingsId) transaction = transaction.patch(siteSettingsId, {set: {
    shortDescription: 'Indian Cuisine & Bar, from tandoor fire to the Malabar coast.',
    description: 'Malabar Coast is an Indian restaurant and bar in Holytown, Scotland, serving tandoor dishes, curries, biriyani, vegetarian plates and Malabar coastal specialities.',
    'defaultSeo.title': 'Malabar Coast | Indian Cuisine & Bar in Holytown',
    'defaultSeo.description': 'Indian tandoor dishes, curries, biriyani and Malabar coastal cooking in Holytown.',
  }})
  await transaction.commit()

  const verified = await client.fetch<Array<{_id: string; headingLineOne?: string; headingLineTwo?: string; areas: string[]}>>(
    `*[_id in ["menuPage", "drafts.menuPage"]] | order(_id asc){_id,headingLineOne,headingLineTwo,"areas":voyageStops[].area}`,
  )
  const expectedAreas = definitions.map((definition) => definition.area)
  if (!verified.every((document) => JSON.stringify(document.areas) === JSON.stringify(expectedAreas))) throw new Error('Post-migration verification found an unexpected Indian destination list.')
  console.log(JSON.stringify({mode: 'applied-and-verified', documents: verified, headings: [baseUpdate.headingLineOne, baseUpdate.headingLineTwo]}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Menu-destination migration failed.')
  process.exit(1)
})
