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
const slug = 'onam'

async function uploadImage(relativePath: string) {
  const absolutePath = join(process.cwd(), 'public', relativePath)
  if (!existsSync(absolutePath)) throw new Error(`Missing Onam artwork: ${relativePath}`)
  const filename = basename(absolutePath)
  const existing = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`, {filename})
  if (existing) return existing
  const asset = await client.assets.upload('image', createReadStream(absolutePath), {filename})
  return asset._id
}

async function main() {
  const existing = await client.fetch<{_id: string; status?: string} | null>(`*[_type == "specialDayCampaign" && slug.current == $slug][0]{_id,status}`, {slug})
  if (!apply) {
    console.log(JSON.stringify({mode: 'dry-run', projectId, dataset, campaign: existing ? {exists: true, id: existing._id, status: existing.status} : {exists: false}}, null, 2))
    return
  }

  const [desktopAssetId, mobileAssetId] = await Promise.all([
    uploadImage('special-days/onam/onam-booking-desktop.png'),
    uploadImage('special-days/onam/onam-booking-mobile.png'),
  ])

  const defaults = {
    title: 'Onam at Malabar Coast',
    slug: {_type: 'slug', current: slug},
    status: 'active',
    desktopHero: {_type: 'image', asset: {_type: 'reference', _ref: desktopAssetId}, alt: 'An Onam pookalam, brass lamps and Kerala sadya beside the backwaters at dusk'},
    mobileHero: {_type: 'image', asset: {_type: 'reference', _ref: mobileAssetId}, alt: 'An Onam flower carpet and glowing brass lamps in a Kerala courtyard'},
    logoRibbon: 'Onam at the coast',
    greeting: 'ഓണാശംസകൾ · Happy Onam · Welcome to the feast',
    heroHeading: 'A table blooming',
    heroAccent: 'for Onam.',
    heroText: 'Pookalam colour, golden lamps and the generous spirit of Kerala gathered around one Malabar Coast table.',
    primaryActionLabel: 'Reserve your Onam table',
    soundActionLabel: 'Festival sounds',
    scrollLabel: 'Follow the flowers',
    storyEyebrow: 'Kerala harvest, Scottish table',
    storyHeading: 'Flower, flame and a feast made for sharing.',
    storyItems: [
      {_type: 'object', _key: 'pookalam', symbol: '✺', title: 'Pookalam', copy: 'A circular carpet of seasonal flowers welcomes abundance, colour and every guest to the celebration.'},
      {_type: 'object', _key: 'lamp', symbol: '✦', title: 'Golden lamps', copy: 'The warm glow of the nilavilakku brings a calm, ceremonial light to the Onam table.'},
      {_type: 'object', _key: 'sadya', symbol: '❧', title: 'A generous feast', copy: 'Banana leaves, many small dishes and the joy of sharing make the sadya the heart of the gathering.'},
    ],
    bookingEyebrow: 'Your Onam gathering',
    bookingHeading: 'Gather around the Onam table.',
    bookingText: 'Bring family, friends or colleagues together for a harvest-season celebration shaped by Kerala hospitality and the generous spirit of Malabar Coast.',
    occasionLabel: 'Onam gathering',
    confirmationEyebrow: 'Your Onam table is on the calendar',
    formHeading: 'Bring your people to the feast.',
    confirmationHeading: 'Your Onam table is confirmed.',
    promiseTitle: 'A welcome for every guest',
    promiseText: 'Share allergies, accessibility needs and the details that will help us prepare your gathering with care.',
    submitLabel: 'Reserve our Onam table',
    closingEyebrow: 'ഓണാശംസകൾ from Malabar Coast',
    closingHeading: 'Flower, flame and feast. A generous Onam table.',
    closingLink: {_type: 'link', label: 'Explore the menu', href: '/menu', openInNewTab: false},
    palette: {_type: 'campaignPalette', night: '#10291F', evergreen: '#24603A', berry: '#D85B23', gold: '#F3C24E', cream: '#FFF5DC', ink: '#173524'},
    emblemStyle: 'floral',
    ambientEffect: 'petals',
    enableSound: false,
    seo: {_type: 'seo', title: 'Onam Table Booking at Malabar Coast', description: 'Reserve an Onam gathering at Malabar Coast in Holytown, inspired by Kerala flowers, lamps and generous hospitality.', image: {_type: 'image', asset: {_type: 'reference', _ref: desktopAssetId}, alt: 'An Onam pookalam, brass lamps and Kerala sadya beside the backwaters at dusk'}},
  }

  let campaignId = existing?._id
  if (campaignId) await client.patch(campaignId).setIfMissing(defaults).commit()
  else campaignId = (await client.create({_type: 'specialDayCampaign', ...defaults}))._id

  const verified = await client.fetch(`*[_id == $campaignId][0]{_id,_type,title,"slug":slug.current,status,emblemStyle,ambientEffect,enableSound,"hasDesktopHero":defined(desktopHero.asset),"hasMobileHero":defined(mobileHero.asset),palette}`, {campaignId})
  console.log(JSON.stringify({mode: 'applied', projectId, dataset, campaign: verified}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Sanity Onam campaign migration failed.')
  process.exitCode = 1
})
