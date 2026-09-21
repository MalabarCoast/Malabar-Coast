import {getSanityClient} from './client'
import {sanitisePublicLink} from './links'
import {bookingExperienceSettingsQuery, liveSpecialDayCampaignsQuery, specialDayCampaignQuery} from './queries'

export type CampaignImage = {
  url: string
  alt: string
  caption?: string
  lqip?: string
  dimensions?: {width: number; height: number; aspectRatio: number}
}

export type SpecialDayCampaign = {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  status: 'active' | 'paused'
  startsAt?: string
  endsAt?: string
  logoRibbon: string
  greeting: string
  heroHeading: string
  heroAccent?: string
  heroText: string
  primaryActionLabel: string
  soundActionLabel?: string
  scrollLabel?: string
  storyEyebrow?: string
  storyHeading: string
  storyItems: Array<{_key: string; symbol: string; title: string; copy: string}>
  bookingEyebrow?: string
  bookingHeading: string
  bookingText: string
  occasionLabel: string
  confirmationEyebrow?: string
  formHeading: string
  confirmationHeading: string
  promiseTitle?: string
  promiseText?: string
  submitLabel: string
  closingEyebrow?: string
  closingHeading: string
  closingLink?: {label: string; href: string; openInNewTab?: boolean}
  palette: {night: string; evergreen: string; berry: string; gold: string; cream: string; ink: string}
  emblemStyle: 'winter' | 'floral' | 'classic'
  ambientEffect: 'snow' | 'petals' | 'none'
  enableSound?: boolean
  desktopHero: CampaignImage
  mobileHero?: CampaignImage
  campaignLogo?: CampaignImage
  jingleUrl?: string
  seo?: {title?: string; description?: string; noIndex?: boolean; image?: CampaignImage}
}

export type BookingExperienceSettings = {
  bookingMode: 'regular' | 'special'
  activeCampaign?: {slug: string; status: 'active' | 'paused'; startsAt?: string; endsAt?: string}
}

const HEX = /^#[0-9a-f]{6}$/i
const cleanColour = (value: string | undefined, fallback: string) => HEX.test(value || '') ? value! : fallback

export const christmasCampaignFallback: SpecialDayCampaign = {
  _id: 'fallback-christmas',
  _updatedAt: '2026-09-21T00:00:00.000Z',
  title: 'A Malabar Coast Christmas',
  slug: 'christmas',
  status: 'active',
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
    {_key: 'star', symbol: '✦', title: 'Star lantern', copy: 'The warm glow of Kerala paper stars meets the Swedish julstjärna.'},
    {_key: 'heart', symbol: '♥', title: 'Woven heart', copy: 'A Scandinavian Christmas heart, coloured with Malabar marigold and saffron.'},
    {_key: 'dala', symbol: '♞', title: 'Dala & diya', copy: 'Nordic folk red sits beside the gentle gleam of a traditional brass lamp.'},
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
  closingLink: {label: 'Explore the menu', href: '/menu'},
  palette: {night: '#061A1D', evergreen: '#174C38', berry: '#931F2E', gold: '#F6C96F', cream: '#F4EAD4', ink: '#102D28'},
  emblemStyle: 'winter',
  ambientEffect: 'snow',
  enableSound: true,
  desktopHero: {url: '/christmas/christmas-booking-hero.png', alt: 'A Nordic and Indian Christmas night at Malabar Coast'},
  mobileHero: {url: '/christmas/christmas-booking-hero.png', alt: 'A Nordic and Indian Christmas night at Malabar Coast'},
  seo: {title: 'Christmas Table Booking', description: 'Reserve a festive Christmas table at Malabar Coast in Holytown.', image: {url: '/christmas/christmas-booking-hero.png', alt: 'A Nordic and Indian Christmas night at Malabar Coast'}},
}

export function isCampaignLive(campaign?: {status: 'active' | 'paused'; startsAt?: string; endsAt?: string}, now = new Date()) {
  if (!campaign || campaign.status !== 'active') return false
  const time = now.getTime()
  return (!campaign.startsAt || new Date(campaign.startsAt).getTime() <= time) && (!campaign.endsAt || new Date(campaign.endsAt).getTime() >= time)
}

function normaliseCampaign(campaign: SpecialDayCampaign): SpecialDayCampaign | null {
  if (!campaign?._id || !campaign.slug || !campaign.desktopHero?.url || !campaign.desktopHero.alt || !campaign.storyItems?.length) return null
  return {
    ...campaign,
    closingLink: sanitisePublicLink(campaign.closingLink),
    palette: {
      night: cleanColour(campaign.palette?.night, '#061A1D'),
      evergreen: cleanColour(campaign.palette?.evergreen, '#174C38'),
      berry: cleanColour(campaign.palette?.berry, '#931F2E'),
      gold: cleanColour(campaign.palette?.gold, '#F6C96F'),
      cream: cleanColour(campaign.palette?.cream, '#F4EAD4'),
      ink: cleanColour(campaign.palette?.ink, '#102D28'),
    },
    emblemStyle: ['winter', 'floral', 'classic'].includes(campaign.emblemStyle) ? campaign.emblemStyle : 'classic',
    ambientEffect: ['snow', 'petals', 'none'].includes(campaign.ambientEffect) ? campaign.ambientEffect : 'none',
    enableSound: campaign.enableSound === true,
  }
}

export async function getBookingExperienceSettings(): Promise<BookingExperienceSettings> {
  const client = getSanityClient()
  if (!client) return {bookingMode: 'regular'}
  try {
    const settings = await client.fetch(bookingExperienceSettingsQuery, {}, {next: {revalidate: 30, tags: ['sanity-booking-route']}}) as BookingExperienceSettings | null
    return settings?.bookingMode === 'special' ? settings : {bookingMode: 'regular'}
  } catch (error) {
    console.error('Sanity booking route fetch failed; using the regular booking page.', error instanceof Error ? error.name : 'UnknownError')
    return {bookingMode: 'regular'}
  }
}

export async function getSpecialDayCampaign(slug: string): Promise<SpecialDayCampaign | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  const client = getSanityClient()
  if (!client) return slug === 'christmas' ? christmasCampaignFallback : null
  try {
    const campaign = await client.fetch(specialDayCampaignQuery, {slug}, {next: {revalidate: 60, tags: ['sanity-special-days']}}) as SpecialDayCampaign | null
    return campaign ? normaliseCampaign(campaign) : slug === 'christmas' ? christmasCampaignFallback : null
  } catch (error) {
    console.error('Sanity special-day campaign fetch failed.', error instanceof Error ? error.name : 'UnknownError')
    return slug === 'christmas' ? christmasCampaignFallback : null
  }
}

export async function getLiveSpecialDayCampaigns(): Promise<Array<{slug: string; updatedAt: string}>> {
  const client = getSanityClient()
  if (!client) return []
  try {
    return await client.fetch(liveSpecialDayCampaignsQuery, {}, {next: {revalidate: 300, tags: ['sanity-special-days']}}) as Array<{slug: string; updatedAt: string}>
  } catch {
    return []
  }
}
