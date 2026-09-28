import {createReadStream, existsSync} from 'node:fs'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

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
const storeDirectory = join(process.cwd(), 'public', 'Store')

const restaurantImages = [
  {file: '1.jpeg', alt: 'The timber bar at Malabar Coast with pendant lights and a fully stocked back bar', caption: 'The bar · Detail'},
  {file: '2.jpeg', alt: 'A wide view of the timber bar and draught taps at Malabar Coast', caption: 'The bar · Welcome'},
  {file: '3.jpeg', alt: 'Dining tables and bench seating beside the timber screen at Malabar Coast', caption: 'The dining room · Intimate tables'},
  {file: '4.jpeg', alt: 'A wide view across Malabar Coast dining booths and freestanding tables', caption: 'The dining room · Room to gather'},
  {file: '5.jpeg', alt: 'The Malabar Coast bar viewed across a long timber sharing table', caption: 'The room · From the long table'},
  {file: '6.jpeg', alt: 'The Malabar Coast dining room with warm timber booths, tables and pendant lighting', caption: 'The dining room · Warm light'},
  {file: '7.jpeg', alt: 'A communal timber table beside the bar inside Malabar Coast', caption: 'The room · Made for sharing'},
  {file: '8.jpeg', alt: 'Booth seating and dining tables beneath warm wall lights at Malabar Coast', caption: 'The dining room · Booths'},
  {file: '9.jpeg', alt: 'Rows of dining tables and a long banquette inside Malabar Coast', caption: 'The dining room · Across the floor'},
  {file: '10.jpeg', alt: 'A broad view of Malabar Coast dining tables, booths and timber wall panelling', caption: 'The dining room · Set for service'},
] as const

type RestaurantPage = {_id: string; sections?: Array<{_key?: string}>}

function filename(entry: (typeof restaurantImages)[number]) {
  return `restaurant-${entry.file}`
}

async function uploadImage(entry: (typeof restaurantImages)[number]) {
  const absolutePath = join(storeDirectory, entry.file)
  if (!existsSync(absolutePath)) throw new Error(`Missing restaurant image: ${entry.file}`)
  const targetFilename = filename(entry)
  const existing = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`, {filename: targetFilename})
  if (existing) return existing
  return (await client.assets.upload('image', createReadStream(absolutePath), {filename: targetFilename}))._id
}

function image(assetId: string, entry: (typeof restaurantImages)[number], key?: string) {
  return {
    ...(key ? {_key: key} : {}),
    _type: 'image',
    asset: {_type: 'reference', _ref: assetId},
    alt: entry.alt,
    caption: entry.caption,
  }
}

async function main() {
  const restaurantPages = await client.fetch<RestaurantPage[]>(`*[_type == "marketingPage" && pageKey == "restaurant"]{_id,sections[]{_key}}`)
  if (!restaurantPages.length) throw new Error('The restaurant marketing page is missing from Sanity.')
  for (const entry of restaurantImages) {
    if (!existsSync(join(storeDirectory, entry.file))) throw new Error(`Missing restaurant image: ${entry.file}`)
  }

  if (!apply) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      restaurantPages: restaurantPages.map((page) => page._id),
      images: restaurantImages.map((entry) => `public/Store/${entry.file}`),
      gallerySectionToCreate: restaurantPages.filter((page) => !page.sections?.some((section) => section._key === 'restaurant-gallery')).map((page) => page._id),
    }, null, 2))
    return
  }

  const assets = new Map<string, string>()
  for (const entry of restaurantImages) assets.set(entry.file, await uploadImage(entry))
  const gallery = restaurantImages.map((entry, index) => image(assets.get(entry.file)!, entry, `restaurant-${index + 1}`))
  const heroEntry = restaurantImages[5]
  const roomEntry = restaurantImages[8]

  let transaction = client.transaction()
  for (const page of restaurantPages) {
    const hasGallery = page.sections?.some((section) => section._key === 'restaurant-gallery')
    transaction = transaction.patch(page._id, (patch) => {
      let next = patch
        .set({
          heroImage: image(assets.get(heroEntry.file)!, heroEntry),
          'sections[_key=="restaurant-room"].image': image(assets.get(roomEntry.file)!, roomEntry),
        })
        .setIfMissing({sections: []})
      if (hasGallery) {
        next = next.set({
          'sections[_key=="restaurant-gallery"].internalName': 'Restaurant gallery',
          'sections[_key=="restaurant-gallery"].eyebrow': 'Inside Malabar Coast · Holytown',
          'sections[_key=="restaurant-gallery"].heading': 'Come into the room.',
          'sections[_key=="restaurant-gallery"].text': 'Warm timber, generous tables and a full bar set the scene for an easy lunch, dinner with friends or a longer evening together.',
          'sections[_key=="restaurant-gallery"].gallery': gallery,
        })
      } else {
        next = next.append('sections', [{
          _type: 'contentSection',
          _key: 'restaurant-gallery',
          internalName: 'Restaurant gallery',
          eyebrow: 'Inside Malabar Coast · Holytown',
          heading: 'Come into the room.',
          text: 'Warm timber, generous tables and a full bar set the scene for an easy lunch, dinner with friends or a longer evening together.',
          gallery,
          theme: 'light',
        }])
      }
      return next
    })
  }
  await transaction.commit()

  const verification = await client.fetch<Array<{
    id: string
    heroUrl?: string
    roomUrl?: string
    gallery: Array<{alt?: string; caption?: string; url?: string}>
  }>>(`*[_type == "marketingPage" && pageKey == "restaurant"]{
    "id": _id,
    "heroUrl": heroImage.asset->url,
    "roomUrl": sections[_key == "restaurant-room"][0].image.asset->url,
    "gallery": sections[_key == "restaurant-gallery"][0].gallery[]{alt,caption,"url":asset->url}
  }`)
  for (const page of verification) {
    if (!page.heroUrl || !page.roomUrl || page.gallery.length !== restaurantImages.length) throw new Error(`Restaurant media verification failed for ${page.id}.`)
    if (new Set(page.gallery.map((entry) => entry.url).filter(Boolean)).size !== restaurantImages.length) throw new Error(`Restaurant gallery contains missing or duplicate assets for ${page.id}.`)
    if (page.gallery.some((entry) => !entry.alt || !entry.caption)) throw new Error(`Restaurant gallery accessibility metadata verification failed for ${page.id}.`)
  }

  console.log(JSON.stringify({
    mode: 'applied-and-verified',
    pages: verification.map((page) => ({id: page.id, galleryImages: page.gallery.length, heroUrl: page.heroUrl, roomUrl: page.roomUrl})),
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Restaurant gallery sync failed.')
  process.exit(1)
})
