import {createReadStream, existsSync, readFileSync} from 'node:fs'
import {basename, join} from 'node:path'
import {createClient} from '@sanity/client'

const envPath = join(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
    if (!process.env[key]) process.env[key] = value
  }
}

const apply = process.argv.includes('--apply')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const token = process.env.SANITY_API_TOKEN?.trim()

if (!projectId || !token) throw new Error('Sanity project configuration or server token is missing.')

const client = createClient({projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false})
const slug = 'christmas'

type ExistingCampaign = {_id: string; title?: string; status?: string; slug?: string}
type ExistingSettings = {bookingMode?: string; activeCampaignId?: string}

async function main() {
const [existingCampaign, existingSettings] = await Promise.all([
  client.fetch<ExistingCampaign | null>(`*[_type == "specialDayCampaign" && slug.current == $slug][0]{_id,title,status,"slug":slug.current}`, {slug}),
  client.fetch<ExistingSettings | null>(`*[_id == "bookingExperienceSettings"][0]{bookingMode,"activeCampaignId":activeCampaign._ref}`),
])

if (!apply) {
  console.log(JSON.stringify({
    mode: 'dry-run',
    projectId,
    dataset,
    campaign: existingCampaign ? {exists: true, id: existingCampaign._id, status: existingCampaign.status} : {exists: false},
    bookingRoute: existingSettings ? {exists: true, mode: existingSettings.bookingMode, hasCampaign: Boolean(existingSettings.activeCampaignId)} : {exists: false},
  }, null, 2))
  process.exit(0)
}

const heroPath = join(process.cwd(), 'public', 'christmas', 'christmas-booking-hero.png')
if (!existsSync(heroPath)) throw new Error('The Christmas campaign hero image is missing.')
const filename = basename(heroPath)
let assetId = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`, {filename})
if (!assetId) {
  const asset = await client.assets.upload('image', createReadStream(heroPath), {filename})
  assetId = asset._id
}

const campaignDefaults = {
  title: 'A Malabar Coast Christmas',
  slug: {_type: 'slug', current: slug},
  status: 'active',
  desktopHero: {_type: 'image', asset: {_type: 'reference', _ref: assetId}, alt: 'A Nordic and Indian Christmas night at Malabar Coast'},
  mobileHero: {_type: 'image', asset: {_type: 'reference', _ref: assetId}, alt: 'A Nordic and Indian Christmas night at Malabar Coast'},
  logoRibbon: 'Christmas at the coast',
  greeting: 'God Jul · Merry Christmas · ക്രിസ്മസ് ആശംസകൾ',
  heroHeading: 'A table wrapped',
  heroAccent: 'in Christmas.',
  heroText: 'Nordic winter magic, Indian warmth and the people you love around one table.',
  primaryActionLabel: 'Reserve your table',
  soundActionLabel: 'Ring the bells',
  scrollLabel: 'Follow the starlight',
  storyEyebrow: 'Two coasts, one Christmas',
  storyHeading: 'From saffron glow to Nordic snow.',
  storyItems: [
    {_type: 'object', _key: 'star', symbol: '✦', title: 'Star lantern', copy: 'The warm glow of Kerala paper stars meets the Swedish julstjärna.'},
    {_type: 'object', _key: 'heart', symbol: '♥', title: 'Woven heart', copy: 'A Scandinavian Christmas heart, coloured with Malabar marigold and saffron.'},
    {_type: 'object', _key: 'dala', symbol: '♞', title: 'Dala & diya', copy: 'Nordic folk red sits beside the gentle gleam of a traditional brass lamp.'},
  ],
  bookingEyebrow: 'Your festive gathering',
  bookingHeading: 'Save a seat for Christmas.',
  bookingText: 'Not quite julbord. Not quite a Kerala feast. Entirely Malabar Coast—prepared with care for family suppers, work parties and winter date nights.',
  occasionLabel: 'Christmas gathering',
  confirmationEyebrow: 'Christmas is on the calendar',
  formHeading: "Tell us who's coming.",
  confirmationHeading: 'Your table is confirmed.',
  promiseTitle: 'Made for every guest',
  promiseText: 'Tell us about allergies, accessibility needs and little details that help us welcome you well.',
  submitLabel: 'Reserve our Christmas table',
  closingEyebrow: 'God jul från Malabar Coast',
  closingHeading: 'Warm spice. Winter light. A very merry table.',
  closingLink: {_type: 'link', label: 'Explore the menu', href: '/menu', openInNewTab: false},
  palette: {_type: 'campaignPalette', night: '#061A1D', evergreen: '#174C38', berry: '#931F2E', gold: '#F6C96F', cream: '#F4EAD4', ink: '#102D28'},
  emblemStyle: 'winter',
  ambientEffect: 'snow',
  enableSound: true,
  seo: {_type: 'seo', title: 'Christmas Table Booking', description: 'Reserve a festive Christmas table at Malabar Coast in Holytown.', image: {_type: 'image', asset: {_type: 'reference', _ref: assetId}, alt: 'A Nordic and Indian Christmas night at Malabar Coast'}},
}

let campaignId = existingCampaign?._id
if (campaignId) {
  await client.patch(campaignId).setIfMissing(campaignDefaults).commit()
} else {
  const created = await client.create({_type: 'specialDayCampaign', ...campaignDefaults})
  campaignId = created._id
}

await client.createIfNotExists({
  _id: 'bookingExperienceSettings',
  _type: 'bookingExperienceSettings',
  bookingMode: 'regular',
  activeCampaign: {_type: 'reference', _ref: campaignId},
  note: 'Switch to special when this campaign should replace the regular /book-a-table page.',
})
await client.patch('bookingExperienceSettings').setIfMissing({
  bookingMode: 'regular',
  activeCampaign: {_type: 'reference', _ref: campaignId},
  note: 'Switch to special when the selected campaign should replace the regular /book-a-table page.',
}).commit()

const verified = await client.fetch(`{
  "campaign": *[_id == $campaignId][0]{_id,_type,title,"slug":slug.current,status,defined(desktopHero.asset) => {"hasDesktopHero":true},defined(mobileHero.asset) => {"hasMobileHero":true},defined(palette) => {"hasPalette":true}},
  "bookingRoute": *[_id == "bookingExperienceSettings"][0]{_id,_type,bookingMode,"activeCampaignId":activeCampaign._ref}
}`, {campaignId})

console.log(JSON.stringify({mode: 'applied', projectId, dataset, ...verified}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Sanity special-days migration failed.')
  process.exitCode = 1
})
