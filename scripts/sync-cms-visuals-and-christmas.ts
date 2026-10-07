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

const media = {
  homePrawns: {file: 'menu/calicut-pepper-prawns.png', alt: 'Black pepper tiger prawns with curry leaf and charred lime'},
  homeChicken: {file: 'menu/chicken-tikka.png', alt: 'Charred chicken tikka with red onion and grilled lemon'},
  homeLamb: {file: 'menu/cape-malay-lamb.png', alt: 'Pepper-spiced lamb with flaky porotta'},
  menuChicken: {file: 'food/chicken-chasni.png', alt: 'Creamy chicken chasni served at Malabar Coast'},
  menuFish: {file: 'food/Meen Moilee.jpeg', alt: 'Meen Moilee fish curry served at Malabar Coast'},
  christmas: {file: 'offers/christmas-day-booking-2026.png', alt: 'Christmas Day table bookings for 25 December 2026 at Malabar Coast'},
} as const

async function uploadImage(relativePath: string) {
  const absolutePath = join(publicDirectory, relativePath)
  if (!existsSync(absolutePath)) throw new Error(`Missing website image: ${relativePath}`)
  const filename = basename(relativePath)
  const existing = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`, {filename})
  if (existing) return existing
  return (await client.assets.upload('image', createReadStream(absolutePath), {filename}))._id
}

function image(assetId: string, alt: string) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}, alt}
}

async function main() {
  const [settings, homePages, menuPages, menuItems, categories, offersPages, promotions] = await Promise.all([
    client.fetch<Array<{_id: string}>>(`*[_id in ["siteSettings","drafts.siteSettings"]]{_id}`),
    client.fetch<Array<{_id: string; hasMenuSection: boolean}>>(`*[_type == "marketingPage" && pageKey == "home"]{_id,"hasMenuSection":count(sections[_key == "home-menu"]) > 0}`),
    client.fetch<Array<{_id: string}>>(`*[_id in ["menuPage","drafts.menuPage"]]{_id}`),
    client.fetch<Array<{_id: string; sourceKey: string}>>(`*[_type == "menuItem" && sourceKey in ["malabar-coast-signature-konju-coconut-fry","clay-oven-chicken-tikka","malabar-coast-signature-aattirachi-kurumulak"]]{_id,sourceKey}`),
    client.fetch<Array<{_id: string; slug: string}>>(`*[_type == "menuCategory" && slug.current in ["beef","rice"]]{_id,"slug":slug.current}`),
    client.fetch<Array<{_id: string}>>(`*[_type == "marketingPage" && pageKey == "offers"]{_id}`),
    client.fetch<Array<{_id: string; slug?: string}>>(`*[_type == "promotion"]{_id,"slug":slug.current}`),
  ])

  if (!settings.length || !homePages.length || !menuPages.length || !offersPages.length) throw new Error('Required Sanity home, menu, offers or site settings documents are missing.')
  if (homePages.some((page) => !page.hasMenuSection)) throw new Error('The home-menu CMS section is missing.')
  const itemId = new Map(menuItems.map((item) => [item.sourceKey, item._id]))
  const categoryId = new Map(categories.map((category) => [category.slug, category._id]))
  for (const key of ['malabar-coast-signature-konju-coconut-fry', 'clay-oven-chicken-tikka', 'malabar-coast-signature-aattirachi-kurumulak']) {
    if (!itemId.has(key)) throw new Error(`Missing CMS dish: ${key}`)
  }
  for (const key of ['beef', 'rice']) if (!categoryId.has(key)) throw new Error(`Missing CMS menu category: ${key}`)

  if (!apply) {
    const christmas = promotions.find((promotion) => promotion.slug === 'christmas-day-bookings-2026' && !promotion._id.startsWith('drafts.'))
    console.log(JSON.stringify({mode: 'dry-run', settings: settings.map(({_id}) => _id), homePages: homePages.map(({_id}) => _id), menuPages: menuPages.map(({_id}) => _id), offersPages: offersPages.map(({_id}) => _id), promotion: christmas?._id || 'create', promotionsToPause: promotions.filter((promotion) => promotion.slug !== 'christmas-day-bookings-2026').map(({_id}) => _id), images: Object.values(media).map(({file}) => `public/${file}`)}, null, 2))
    return
  }

  const assets = new Map<string, string>()
  for (const entry of Object.values(media)) assets.set(entry.file, await uploadImage(entry.file))
  const cmsImage = (entry: (typeof media)[keyof typeof media]) => image(assets.get(entry.file)!, entry.alt)

  const featuredDishes = [
    {_type: 'object', _key: 'konju-coconut-fry', dish: {_type: 'reference', _ref: itemId.get('malabar-coast-signature-konju-coconut-fry')!}, image: cmsImage(media.homePrawns), note: 'From Calicut · Small plate'},
    {_type: 'object', _key: 'chicken-tikka', dish: {_type: 'reference', _ref: itemId.get('clay-oven-chicken-tikka')!}, image: cmsImage(media.homeChicken), note: 'From Delhi · Tandoor fire'},
    {_type: 'object', _key: 'aattirachi-kurumulak', dish: {_type: 'reference', _ref: itemId.get('malabar-coast-signature-aattirachi-kurumulak')!}, image: cmsImage(media.homeLamb), note: 'From the fire · Made for sharing'},
  ]
  const menuInterludes = [
    {_type: 'object', _key: 'after-beef', afterCategory: {_type: 'reference', _ref: categoryId.get('beef')!}, image: cmsImage(media.menuChicken), eyebrow: 'From the curry pot', title: 'Creamy, bright and gently tangy.'},
    {_type: 'object', _key: 'after-rice', afterCategory: {_type: 'reference', _ref: categoryId.get('rice')!}, image: cmsImage(media.menuFish), eyebrow: 'From the coast', title: 'Coconut, curry leaf and a gentler tide.'},
  ]

  let transaction = client.transaction()
  for (const setting of settings) transaction = transaction.patch(setting._id, {set: {establishedDate: '2026-06-01'}})
  for (const page of homePages) transaction = transaction.patch(page._id, {set: {
    heroTertiaryLink: {_type: 'link', label: 'Book the private hall', href: '/hall', openInNewTab: false},
    'sections[_key=="home-menu"].featuredDishes': featuredDishes,
  }})
  for (const page of menuPages) transaction = transaction.patch(page._id, {set: {menuInterludes}})
  for (const page of offersPages) transaction = transaction.patch(page._id, {set: {
    eyebrow: 'Christmas Day · 25 December 2026',
    heroHeading: 'Christmas Day at Malabar Coast.',
    heroText: 'Reserve your table for Christmas Day in Holytown.',
  }})
  for (const otherPromotion of promotions) {
    if (otherPromotion.slug !== 'christmas-day-bookings-2026') transaction = transaction.patch(otherPromotion._id, {set: {status: 'paused', showOnHomepage: false}})
  }
  await transaction.commit()

  const promotion = {
    _type: 'promotion',
    title: 'Christmas Day at Malabar Coast',
    slug: {_type: 'slug', current: 'christmas-day-bookings-2026'},
    status: 'active',
    endsAt: '2026-12-26T23:59:59.000Z',
    poster: cmsImage(media.christmas),
    badge: 'Christmas Day · 25 December 2026',
    summary: 'Book your Christmas Day table at Malabar Coast in Holytown.',
    validityLabel: 'Tables are subject to availability',
    showOnHomepage: true,
    displayDurationSeconds: 7,
    callToAction: {_type: 'link', label: 'Book a table', href: '/book-a-table', openInNewTab: false},
    terms: 'Christmas Day tables are subject to availability and restaurant confirmation.',
    displayOrder: 1,
  }
  const existingPromotion = promotions.find((candidate) => candidate.slug === 'christmas-day-bookings-2026' && !candidate._id.startsWith('drafts.'))
  if (existingPromotion) await client.patch(existingPromotion._id).set(promotion).unset(['startsAt']).commit()
  else await client.create(promotion)

  const verification = await client.fetch<{
    sanityNow: string
    activeChristmas: number
    activePromotions: Array<{slug?: string; homepage?: boolean}>
    establishedDate?: string
    home: Array<{id: string; hallHref?: string; dishes: number}>
    menu: Array<{id: string; interludes: number}>
    christmas?: {title?: string; status?: string; poster?: string; href?: string; duration?: number}
  }>(`{
    "sanityNow": now(),
    "activeChristmas": count(*[_type == "promotion" && slug.current == "christmas-day-bookings-2026" && status == "active" && (!defined(startsAt) || startsAt <= now()) && (!defined(endsAt) || endsAt >= now())]),
    "activePromotions": *[_type == "promotion" && status == "active" && !(_id in path("drafts.**")) && (!defined(startsAt) || startsAt <= now()) && (!defined(endsAt) || endsAt >= now())]{"slug":slug.current,"homepage":showOnHomepage},
    "establishedDate": *[_id == "siteSettings"][0].establishedDate,
    "home": *[_type == "marketingPage" && pageKey == "home"]{"id":_id,"hallHref":heroTertiaryLink.href,"dishes":count(sections[_key == "home-menu"][0].featuredDishes)},
    "menu": *[_id in ["menuPage","drafts.menuPage"]]{"id":_id,"interludes":count(menuInterludes)},
    "christmas": *[_type == "promotion" && slug.current == "christmas-day-bookings-2026" && !(_id in path("drafts.**"))][0]{title,status,"poster":poster.asset->url,"href":callToAction.href,"duration":displayDurationSeconds}
  }`)
  if (verification.establishedDate !== '2026-06-01') throw new Error('Established date verification failed.')
  if (verification.activeChristmas !== 1) throw new Error(`Christmas offer is not active at Sanity time ${verification.sanityNow}.`)
  if (verification.activePromotions.length !== 1 || verification.activePromotions[0]?.slug !== 'christmas-day-bookings-2026' || verification.activePromotions[0]?.homepage !== true) throw new Error('Christmas is not the only live homepage offer.')
  if (verification.home.some((page) => page.hallHref !== '/hall' || page.dishes !== 3)) throw new Error('Home CMS verification failed.')
  if (verification.menu.some((page) => page.interludes !== 2)) throw new Error('Menu interlude verification failed.')
  if (verification.christmas?.status !== 'active' || !verification.christmas.poster || verification.christmas.href !== '/book-a-table' || verification.christmas.duration !== 7) throw new Error('Christmas offer verification failed.')
  console.log(JSON.stringify({mode: 'applied-and-verified', ...verification}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'CMS visual and Christmas sync failed.')
  process.exit(1)
})
