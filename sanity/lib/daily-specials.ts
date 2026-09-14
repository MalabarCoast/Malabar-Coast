import {getSanityClient} from './client'
import {activeDailySpecialsQuery} from './queries'
import {sanitisePublicLink} from './links'
import {isWithinSchedule} from '@/app/lib/restaurant-schedule'
import {getRestaurantSchedule} from '@/app/lib/schedule-store'

export type DailySpecial = {
  _id: string
  title: string
  status: 'active' | 'soldOut'
  badge?: string
  description: string
  pricePence: number
  priceNote?: string
  dietaryNote?: string
  activeDays?: string[]
  startsAt?: string
  endsAt?: string
  callToAction?: {label: string; href: string; openInNewTab?: boolean}
  image: {url: string; alt: string; caption?: string; lqip?: string; dimensions?: {width: number; height: number; aspectRatio: number}}
  menuItem?: {id: string; pricePence?: number; available: boolean; onlineOrdering: boolean; isAlcoholic: boolean}
}

export async function getActiveDailySpecials(): Promise<DailySpecial[]> {
  const now = new Date()
  const restaurantDate = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/London'}).format(now)
  if (!isWithinSchedule(await getRestaurantSchedule(), restaurantDate)) return []
  const dayName = new Intl.DateTimeFormat('en-GB', {weekday: 'long', timeZone: 'Europe/London'}).format(now).toLowerCase()
  const client = getSanityClient()
  if (!client) return []
  try {
    const records = await client.fetch(activeDailySpecialsQuery, {}, {next: {revalidate: 60, tags: ['sanity-daily-specials']}}) as DailySpecial[]
    return records
      .filter((special) => Boolean(special._id && special.title && special.description && Number.isInteger(special.pricePence) && special.image?.url && special.image?.alt))
      .filter((special) => !special.activeDays?.length || special.activeDays.includes(dayName))
      .map((special) => ({...special, callToAction: sanitisePublicLink(special.callToAction)}))
  } catch (error) {
    console.error("Sanity daily specials fetch failed; using menu fallbacks.", error instanceof Error ? error.name : 'UnknownError')
    return []
  }
}
