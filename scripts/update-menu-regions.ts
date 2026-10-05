import {createReadStream, existsSync} from 'node:fs'
import {basename, join} from 'node:path'
import {createClient} from '@sanity/client'

try {
  process.loadEnvFile?.('.env.local')
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

const apply = process.argv.includes('--apply')
const skipImageUpload = process.argv.includes('--skip-image-upload')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const token = process.env.SANITY_API_TOKEN?.trim()

if (!projectId || !token) throw new Error('Sanity project configuration and SANITY_API_TOKEN are required.')

const client = createClient({projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw'})
const publicDirectory = join(process.cwd(), 'public')

const definitions = [
  {key: 'kochi', sourceKey: 'malabar-coast-signature-meen-moilee', area: 'Kochi', region: 'Kerala', coordinates: '9.9312° N · 76.2673° E', yearLabel: 'Arabian Sea harbour', courseLabel: 'Meen Moilee', imageFile: 'food/Meen Moilee.jpeg', alt: 'Meen Moilee served at Malabar Coast', description: 'A gentle fish and coconut curry that keeps Kerala’s coastal cooking at the heart of the journey.'},
  {key: 'kozhikode', sourceKey: 'malabar-coast-signature-aattirachi-kurumulak', area: 'Kozhikode', region: 'Kerala', coordinates: '11.2588° N · 75.7804° E', yearLabel: 'Historic spice port', courseLabel: 'Aattirachi Kurumulak', imageFile: 'food/aatirachi kurumulak ittath.jpeg', alt: 'Aattirachi Kurumulak served at Malabar Coast', description: 'Pepper-led lamb recalls the spice trade that made Kozhikode one of the coast’s great meeting places.'},
  {key: 'mangaluru', sourceKey: 'malabar-coast-signature-masala-grilled-fish', area: 'Mangaluru', region: 'Karnataka coast', coordinates: '12.9141° N · 74.8560° E', yearLabel: 'Western coast', courseLabel: 'Masala Grilled Fish', imageFile: 'food/Masala grill fish.jpeg', alt: 'Masala grilled fish served at Malabar Coast', description: 'Masala-coated grilled fish carries the bright heat and sea-facing character of India’s western coast.'},
  {key: 'mumbai', sourceKey: 'chicken-chicken-chasni', area: 'Mumbai', region: 'Maharashtra', coordinates: '19.0760° N · 72.8777° E', yearLabel: 'Gateway harbour', courseLabel: 'Chicken Chasni', imageFile: 'food/chicken-chasni.png', alt: 'Creamy chicken chasni served at Malabar Coast', description: 'A creamy, gently sweet-and-tangy chicken curry for a city whose tables bring regional flavours together.'},
  {key: 'surat', sourceKey: 'breads-peshwari-naan', area: 'Surat', region: 'Gujarat', coordinates: '21.1702° N · 72.8311° E', yearLabel: 'Gulf of Khambhat', courseLabel: 'Peshwari Naan', imageFile: 'food/Peshwari naan.jpeg', alt: 'Peshwari naan served at Malabar Coast', description: 'A fragrant, fruit-and-nut-filled naan marks Gujarat on the west-coast route with a sweet counterpoint.'},
  {key: 'chennai', sourceKey: 'dosa-masala-dosa', area: 'Chennai', region: 'Tamil Nadu', coordinates: '13.0827° N · 80.2707° E', yearLabel: 'Coromandel coast', courseLabel: 'Dosa', imageFile: 'food/Chennai masala dosa.jpeg', alt: 'Chennai-style masala dosa served with sambar and chutneys', description: 'A crisp masala dosa brings Tamil Nadu’s griddle tradition to the final stop on the Coromandel Coast.'},
] as const

const additionalDescriptions = [
  {sourceKey: 'malabar-coast-signature-konju-coconut-fry', description: 'Prawns tossed with toasted coconut, curry leaves and Malabar spices for a dry, savoury finish.'},
  {sourceKey: 'malabar-coast-signature-aattirachi-kurumulak', description: 'Slow-cooked lamb layered with cracked black pepper, shallots and curry leaves.'},
] as const

const baseUpdate = {
  eyebrow: 'India’s port kitchens · Coast to coast',
  headingLineOne: 'Six ports.',
  headingLineTwo: 'One table.',
  introduction: 'Follow the sea route from Kerala’s Kochi and Kozhikode to Mangaluru, Mumbai, Surat and Chennai, paired with real dishes served at Malabar Coast.',
  journeyLinkLabel: 'Explore the port cities',
  manifestEyebrow: 'The full menu',
  manifestHeading: 'What we carry to the table.',
  manifestIntroduction: 'The current Malabar Coast menu, prepared for sharing and available to order online where shown.',
  dietaryNotice: 'D means dairy, N means nuts and G means gluten. Only the restaurant-supplied markers are shown. Please tell the team about all allergies before ordering because recipes can change and cross-contact may occur.',
  alcoholNotice: 'Drink prices are not published online. Please ask the coastal crew for current soft drink, hot drink, mixer and bar prices. Drinks are not available through online ordering.',
  'seo.title': 'Indian Cuisine & Bar Menu in Holytown',
  'seo.description': 'Explore tandoori chicken, chicken tikka, biriyani, curries, vegetarian dishes, Malabar coastal specialities and desserts at Malabar Coast.',
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
  const [pages, dishes, drinks, homePageId, siteSettingsId] = await Promise.all([
    client.fetch<Array<{_id: string; voyageStops?: Array<{_key?: string}>}>>(`*[_id in ["menuPage", "drafts.menuPage"]]{_id,voyageStops[]{_key}}`),
    client.fetch<Array<{_id: string; sourceKey: string; image?: {_type: 'image'; asset?: {_type: 'reference'; _ref: string}; alt?: string}}>>(
      `*[_type == "menuItem" && sourceKey in $sourceKeys]{_id,sourceKey,image}`,
      {sourceKeys},
    ),
    client.fetch<Array<{_id: string}>>(`*[_type == "menuItem" && category->slug.current in ["soft-drinks","tea-coffee","draught-beer","bottled-beer-cider","spirits","wine","mixers"]]{_id}`),
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
      featured: index < 3,
    }})
  }
  for (const definition of additionalDescriptions) transaction = transaction.patch(dishByKey.get(definition.sourceKey)!, {set: {description: definition.description}})
  for (const drink of drinks) transaction = transaction.patch(drink._id, {set: {priceLabel: 'Ask the coastal crew', hidePrice: true, onlineOrdering: false}})
  if (homePageId) transaction = transaction.patch(homePageId, {set: {
    eyebrow: 'Indian Cuisine & Bar · Holytown',
    heroText: 'Tandoor fire, fragrant biriyani, rich curries and Malabar coastal flavours, served with a full bar in the heart of Holytown.',
    'sections[_key=="home-menu"].eyebrow': 'From coast and tandoor',
    'sections[_key=="home-menu"].body': block('From Kerala’s coastal curries to dishes carried through India’s port cities, our table follows the spice route to Scotland.'),
  }})
  if (siteSettingsId) transaction = transaction.patch(siteSettingsId, {set: {
    shortDescription: 'Indian Cuisine & Bar, from tandoor fire to the Malabar coast.',
    description: 'Malabar Coast is an Indian restaurant and bar in Holytown, Scotland, serving tandoor dishes, curries, biriyani, vegetarian plates and Malabar coastal specialities.',
    'defaultSeo.title': 'Malabar Coast UK | Indian Restaurant & Bar in Holytown',
    'defaultSeo.description': 'Malabar Coast serves Indian tandoor dishes, curries, biriyani and coastal specialities in Holytown, Scotland.',
  }})
  await transaction.commit()

  const verified = await client.fetch<Array<{_id: string; headingLineOne?: string; headingLineTwo?: string; journeyLinkLabel?: string; areas: string[]; stops: Array<{area?: string; courseLabel?: string; dishSourceKey?: string; imageUrl?: string}>}>>(
    `*[_id in ["menuPage", "drafts.menuPage"]] | order(_id asc){_id,eyebrow,headingLineOne,headingLineTwo,introduction,journeyLinkLabel,manifestEyebrow,manifestHeading,manifestIntroduction,dietaryNotice,alcoholNotice,seo,"areas":voyageStops[].area,"stops":voyageStops[]{area,courseLabel,"dishSourceKey":dish->sourceKey,"imageUrl":image.asset->url}}`,
  )
  const expectedAreas = definitions.map((definition) => definition.area)
  if (!verified.every((document) => JSON.stringify(document.areas) === JSON.stringify(expectedAreas))) throw new Error('Post-migration verification found an unexpected Indian destination list.')
  if (!verified.every((document) => document.headingLineOne === baseUpdate.headingLineOne && document.headingLineTwo === baseUpdate.headingLineTwo && document.journeyLinkLabel === baseUpdate.journeyLinkLabel)) throw new Error('Post-migration verification found stale menu-page copy.')
  if (!verified.every((document) => document.stops.some((stop) => stop.area === 'Chennai' && stop.courseLabel === 'Dosa' && stop.dishSourceKey === 'dosa-masala-dosa' && Boolean(stop.imageUrl)))) throw new Error('Post-migration verification found an incomplete Chennai dosa stop.')
  const drinkVerification = await client.fetch<{total: number; visiblePrices: number; orderable: number; labelMismatch: number}>(`{
    "total": count(*[_type == "menuItem" && category->slug.current in ["soft-drinks","tea-coffee","draught-beer","bottled-beer-cider","spirits","wine","mixers"]]),
    "visiblePrices": count(*[_type == "menuItem" && category->slug.current in ["soft-drinks","tea-coffee","draught-beer","bottled-beer-cider","spirits","wine","mixers"] && hidePrice != true]),
    "orderable": count(*[_type == "menuItem" && category->slug.current in ["soft-drinks","tea-coffee","draught-beer","bottled-beer-cider","spirits","wine","mixers"] && onlineOrdering == true]),
    "labelMismatch": count(*[_type == "menuItem" && category->slug.current in ["soft-drinks","tea-coffee","draught-beer","bottled-beer-cider","spirits","wine","mixers"] && priceLabel != "Ask the coastal crew"])
  }`)
  if (drinkVerification.visiblePrices || drinkVerification.orderable || drinkVerification.labelMismatch) throw new Error('Post-migration verification found a drink price or ordering setting still exposed.')
  console.log(JSON.stringify({mode: 'applied-and-verified', documents: verified, headings: [baseUpdate.headingLineOne, baseUpdate.headingLineTwo], drinks: drinkVerification}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Menu-destination migration failed.')
  process.exit(1)
})
