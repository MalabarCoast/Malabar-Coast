import {createReadStream, existsSync} from 'node:fs'
import {basename, join} from 'node:path'
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
const publicDirectory = join(process.cwd(), 'public')

const eventImages = [
  {file: 'festive1.jpeg', alt: 'Guests gathered in the Malabar Coast private hall for a family celebration', caption: 'Celebration layout'},
  {file: 'festive2.jpeg', alt: 'The private hall dressed with balloons and tables for a celebration', caption: 'Room dressed for the day'},
  {file: 'festive3.jpeg', alt: 'A celebration table and balloon backdrop beside the private hall stage', caption: 'A stage made personal'},
  {file: 'festive4.jpeg', alt: 'Guests sharing a celebration moment beside the decorated stage', caption: 'Moments together'},
  {file: 'festive5.jpeg', alt: 'The private hall arranged with theatre seating facing the stage', caption: 'Theatre seating'},
  {file: 'festive6.jpeg', alt: 'Guests enjoying a celebration in the Malabar Coast private hall', caption: 'A full room'},
  {file: 'festive7.jpeg', alt: 'A wide view of the private hall prepared with rows of seating', caption: 'Flexible floor plan'},
  {file: 'festive8.jpeg', alt: 'The private hall set with tables and seating viewed from the bar', caption: 'Table layout and bar'},
  {file: 'festive9.jpeg', alt: 'Guests gathered around tables during a private hall celebration', caption: 'Made for gathering'},
] as const

async function uploadImage(filename: string) {
  const absolutePath = join(publicDirectory, filename)
  if (!existsSync(absolutePath)) throw new Error(`Missing hall image: ${filename}`)
  const existing = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`, {filename: basename(filename)})
  if (existing) return existing
  return (await client.assets.upload('image', createReadStream(absolutePath), {filename: basename(filename)}))._id
}

function image(assetId: string, alt: string, key?: string, caption?: string) {
  return {
    ...(key ? {_key: key} : {}),
    ...(caption ? {caption} : {}),
    _type: 'image',
    asset: {_type: 'reference', _ref: assetId},
    alt,
  }
}

async function main() {
  const hallPages = await client.fetch<Array<{_id: string}>>(`*[_type == "marketingPage" && pageKey == "hall"]{_id}`)
  if (!hallPages.length) throw new Error('The hall marketing page is missing from Sanity.')

  for (const entry of eventImages) {
    if (!existsSync(join(publicDirectory, entry.file))) throw new Error(`Missing hall image: ${entry.file}`)
  }

  if (!apply) {
    console.log(JSON.stringify({mode: 'dry-run', hallPages: hallPages.map((page) => page._id), images: eventImages.map((entry) => entry.file)}, null, 2))
    return
  }

  const assets = new Map<string, string>()
  for (const entry of eventImages) assets.set(entry.file, await uploadImage(entry.file))
  const gallery = eventImages.map((entry, index) => image(assets.get(entry.file)!, entry.alt, `festive-${index + 1}`, entry.caption))

  let transaction = client.transaction()
  for (const page of hallPages) {
    transaction = transaction.patch(page._id, {set: {
      heroImage: image(assets.get('festive1.jpeg')!, eventImages[0].alt),
      'sections[_key=="hall-stage"].image': image(assets.get('festive5.jpeg')!, eventImages[4].alt),
      'sections[_key=="hall-gallery"].internalName': 'Celebrations in the hall',
      'sections[_key=="hall-gallery"].eyebrow': 'Real gatherings · Real layouts',
      'sections[_key=="hall-gallery"].heading': 'Made for the moment.',
      'sections[_key=="hall-gallery"].image': image(assets.get('festive6.jpeg')!, eventImages[5].alt),
      'sections[_key=="hall-gallery"].gallery': gallery,
    }})
  }
  await transaction.commit()

  const verification = await client.fetch<Array<{
    id: string
    heroUrl?: string
    stageUrl?: string
    gallery: Array<{alt?: string; caption?: string; url?: string}>
  }>>(`*[_type == "marketingPage" && pageKey == "hall"]{
    "id": _id,
    "heroUrl": heroImage.asset->url,
    "stageUrl": sections[_key == "hall-stage"][0].image.asset->url,
    "gallery": sections[_key == "hall-gallery"][0].gallery[]{alt, caption, "url": asset->url}
  }`)

  for (const page of verification) {
    if (!page.heroUrl || !page.stageUrl || page.gallery.length !== eventImages.length) throw new Error(`Hall media verification failed for ${page.id}.`)
    if (new Set(page.gallery.map((item) => item.url).filter(Boolean)).size !== eventImages.length) throw new Error(`Hall gallery contains missing or duplicate assets for ${page.id}.`)
    if (page.gallery.some((item) => !item.alt)) throw new Error(`Hall gallery alt text verification failed for ${page.id}.`)
    if (page.gallery.some((item) => !item.caption)) throw new Error(`Hall gallery caption verification failed for ${page.id}.`)
  }

  console.log(JSON.stringify({mode: 'applied-and-verified', pages: verification.map((page) => ({id: page.id, galleryImages: page.gallery.length, heroUrl: page.heroUrl, stageUrl: page.stageUrl}))}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Hall event media sync failed.')
  process.exit(1)
})
