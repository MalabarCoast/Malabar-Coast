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

const socials = [
  {_key: 'instagram', _type: 'object', platform: 'Instagram', url: 'https://www.instagram.com/malabarcoastuk'},
  {_key: 'facebook', _type: 'object', platform: 'Facebook', url: 'https://www.facebook.com/p/Malabar-Coast-61589380673072/'},
  {_key: 'tiktok', _type: 'object', platform: 'TikTok', url: 'https://www.tiktok.com/@malabar.coast'},
]

const storyImages = {
  hero: {file: 'story/restaurant-kitchen-service.jpg', alt: 'A restaurant cook finishing a coconut fish curry during service'},
  pepper: {file: 'story/restaurant-spice-prep.jpg', alt: 'A restaurant cook crushing black pepper and cardamom in a stone mortar during preparation'},
  monsoon: {file: 'story/restaurant-service-pass.jpg', alt: 'A cook passing a bowl of coconut fish curry to the restaurant service team'},
  history: {file: 'story/restaurant-shared-table.jpg', alt: 'Guests passing appam across a shared table of Kerala dishes'},
} as const

const offers = [
  {
    slug: 'coastal-weekday-table',
    title: 'The coastal weekday table',
    badge: 'Weekday dining',
    summary: 'Join us Sunday to Thursday and ask the coastal crew about the current chef-selected dining offer.',
    validityLabel: 'Available on selected quieter services',
    terms: 'Subject to availability and change. Please ask the team when booking and mention the offer before ordering. Not valid with another promotion.',
    imageFile: 'food/Garlic naan butter chicken combo.jpeg',
    imageAlt: 'Garlic naan and butter chicken served at Malabar Coast',
    callToAction: {_type: 'link', label: 'Explore the menu', href: '/menu', openInNewTab: false},
    displayOrder: 10,
  },
  {
    slug: 'celebration-tables',
    title: 'Gather by the coast',
    badge: 'Celebrations & groups',
    summary: 'Bring birthdays, family gatherings and shared tables together with a menu shaped around your occasion.',
    validityLabel: 'Advance enquiry recommended',
    terms: 'Group arrangements depend on party size, date and availability. The team will confirm the menu and any deposit before your event.',
    imageFile: 'food/Masala grill fish.jpeg',
    imageAlt: 'Masala grilled fish served at Malabar Coast',
    callToAction: {_type: 'link', label: 'Plan a special event', href: '/hall', openInNewTab: false},
    displayOrder: 20,
  },
  {
    slug: 'table-for-two',
    title: 'A table for two',
    badge: 'Evening dining',
    summary: 'Settle in for tandoor fire, coastal curries and an unhurried evening at Malabar Coast.',
    validityLabel: 'Selected evening services',
    terms: 'Tables remain subject to live availability. Any current extras or inclusions will be confirmed by the team before your booking.',
    imageFile: 'food/Butter chicken.jpeg',
    imageAlt: 'Butter chicken served at Malabar Coast',
    callToAction: {_type: 'link', label: 'Book your table', href: '/book-a-table', openInNewTab: false},
    displayOrder: 30,
  },
] as const

async function uploadImage(relativePath: string) {
  const absolutePath = join(publicDirectory, relativePath)
  if (!existsSync(absolutePath)) throw new Error(`Missing website image: ${relativePath}`)
  const filename = basename(relativePath)
  const existing = await client.fetch<{_id: string} | null>(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]{_id}`, {filename})
  if (existing?._id) return existing._id
  return (await client.assets.upload('image', createReadStream(absolutePath), {filename}))._id
}

function image(assetId: string, alt: string) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}, alt}
}

async function main() {
  const [settings, stories, restaurantPages, offersPages, promotions] = await Promise.all([
    client.fetch<Array<{_id: string; primaryNavigation?: Array<Record<string, unknown> & {_key?: string; href?: string}>}>>(`*[_id in ["siteSettings","drafts.siteSettings"]]{_id,primaryNavigation}`),
    client.fetch<Array<{_id: string}>>(`*[_type == "marketingPage" && pageKey == "story"]{_id}`),
    client.fetch<Array<{_id: string}>>(`*[_type == "marketingPage" && pageKey == "restaurant"]{_id}`),
    client.fetch<Array<{_id: string}>>(`*[_type == "marketingPage" && pageKey == "offers"]{_id}`),
    client.fetch<Array<{_id: string; badge?: string; title?: string; slug?: {current?: string}}>>(`*[_type == "promotion" && !(_id in path("drafts.**"))]{_id,badge,title,slug}`),
  ])

  if (!settings.length || !stories.length || !restaurantPages.length || !offersPages.length) throw new Error('Required Sanity singleton content is missing.')

  if (!apply) {
    console.log(JSON.stringify({mode: 'dry-run', settings: settings.map((item) => item._id), stories: stories.map((item) => item._id), restaurantPages: restaurantPages.map((item) => item._id), offersPages: offersPages.map((item) => item._id), offers: offers.map((offer) => offer.slug)}, null, 2))
    return
  }

  const imageFiles = [...Object.values(storyImages).map((entry) => entry.file), ...offers.map((offer) => offer.imageFile)]
  const assetIds = new Map<string, string>()
  for (const file of imageFiles) assetIds.set(file, await uploadImage(file))

  let transaction = client.transaction()
  for (const setting of settings) {
    const primaryNavigation = (setting.primaryNavigation || []).map((link) => link.href === '/hall' ? {
      ...link,
      label: 'Special events',
      eyebrow: 'Events & private dining',
      description: 'Celebrate, gather and enquire about the private event space',
    } : link)
    transaction = transaction.patch(setting._id, {set: {socialLinks: socials, primaryNavigation}})
  }
  for (const story of stories) transaction = transaction.patch(story._id, {set: {
    heroImage: image(assetIds.get(storyImages.hero.file)!, storyImages.hero.alt),
    'sections[_key=="story-inspiration"].eyebrow': 'Our Inspiration',
    'sections[_key=="story-pepper"].image': image(assetIds.get(storyImages.pepper.file)!, storyImages.pepper.alt),
    'sections[_key=="story-monsoon"].heading': 'The monsoon road.',
    'sections[_key=="story-monsoon"].image': image(assetIds.get(storyImages.monsoon.file)!, storyImages.monsoon.alt),
    'sections[_key=="story-table"].eyebrow': 'The living landscape',
    'sections[_key=="story-table"].heading': 'History, still alive.',
    'sections[_key=="story-table"].image': image(assetIds.get(storyImages.history.file)!, storyImages.history.alt),
  }})
  for (const restaurant of restaurantPages) transaction = transaction.patch(restaurant._id, {set: {
    'sections[_key=="restaurant-restaurants"].eyebrow': 'Our Restaurants',
    'sections[_key=="restaurant-food"].eyebrow': 'The Food of Malabar',
    'sections[_key=="restaurant-restaurants"].body[_key=="restaurants-location-title"].children[0].text': 'Motherwell',
  }})
  for (const page of offersPages) transaction = transaction.patch(page._id, {set: {
    eyebrow: 'Current offers · At Malabar Coast',
    heroHeading: 'Offers worth gathering for.',
    heroText: 'Dining moments for quieter weekdays, celebrations and evenings together. Each live offer and its terms are shown below.',
  }})
  await transaction.commit()

  const reusableTemplate = promotions.find((promotion) => promotion.badge?.toLocaleLowerCase('en-GB') === 'offer template') || promotions[0]
  for (const [index, offer] of offers.entries()) {
    const existing = promotions.find((promotion) => promotion.slug?.current === offer.slug) || (index === 0 ? reusableTemplate : undefined)
    const document = {
      _type: 'promotion',
      title: offer.title,
      slug: {_type: 'slug', current: offer.slug},
      status: 'active',
      poster: image(assetIds.get(offer.imageFile)!, offer.imageAlt),
      badge: offer.badge,
      summary: offer.summary,
      validityLabel: offer.validityLabel,
      showOnHomepage: index === 0,
      callToAction: offer.callToAction,
      terms: offer.terms,
      displayOrder: offer.displayOrder,
    }
    if (existing) await client.patch(existing._id).set(document).unset(['offerCode', 'startsAt', 'endsAt', 'popupDesktopPoster', 'popupMobilePoster']).commit()
    else await client.create(document)
  }

  const verification = await client.fetch<{
    socials: string[]
    hallLabels: string[]
    storyImages: string[]
    offerTemplateCount: number
    offers: Array<{title: string; cta?: string}>
  }>(`{
    "socials": *[_id == "siteSettings"][0].socialLinks[].platform,
    "hallLabels": *[_id == "siteSettings"][0].primaryNavigation[href == "/hall"].label,
    "storyImages": [
      *[_type == "marketingPage" && pageKey == "story"][0].heroImage.asset->url,
      *[_type == "marketingPage" && pageKey == "story"][0].sections[_key == "story-pepper"][0].image.asset->url,
      *[_type == "marketingPage" && pageKey == "story"][0].sections[_key == "story-monsoon"][0].image.asset->url,
      *[_type == "marketingPage" && pageKey == "story"][0].sections[_key == "story-table"][0].image.asset->url
    ],
    "offerTemplateCount": count(*[_type == "promotion" && lower(badge) == "offer template"]),
    "offers": *[_type == "promotion" && status == "active"] | order(displayOrder asc){title,"cta":callToAction.label}
  }`)
  if (!verification.socials.includes('Facebook') || !verification.socials.includes('TikTok')) throw new Error('Social profile verification failed.')
  if (!verification.hallLabels.includes('Special events')) throw new Error('Special events navigation verification failed.')
  if (new Set(verification.storyImages.filter(Boolean)).size !== 4) throw new Error('Story image verification found duplicate or missing assets.')
  if (verification.offerTemplateCount || verification.offers.filter((offer) => offer.cta === 'Explore the menu').length !== 1) throw new Error('Offer verification failed.')
  console.log(JSON.stringify({mode: 'applied-and-verified', ...verification}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Client feedback sync failed.')
  process.exit(1)
})
