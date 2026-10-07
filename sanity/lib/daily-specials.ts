import {getSanityClient} from './client'
import {activeDailySpecialsQuery} from './queries'
import {sanitisePublicLink} from './links'
import {isWithinSchedule} from '@/app/lib/restaurant-schedule'
import {getRestaurantSchedule} from '@/app/lib/schedule-store'
import type {CmsImageSource} from './image'

type DailySpecialImage = CmsImageSource & {
  alt: string
  caption?: string
  lqip?: string
  dimensions?: {width: number; height: number; aspectRatio: number}
}

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
  image: DailySpecialImage
  menuItem?: {id: string; name: string; description?: string; pricePence?: number; dietaryNotes?: string; allergens?: string[]; available: boolean; onlineOrdering: boolean; isAlcoholic: boolean; image?: DailySpecial['image']}
}

type DailySpecialRecord = Omit<DailySpecial, 'title' | 'description' | 'pricePence' | 'image'> & {
  titleOverride?: string
  descriptionOverride?: string
  priceOverridePence?: number
  imageOverride?: DailySpecial['image']
  legacyTitle?: string
  legacyDescription?: string
  legacyPricePence?: number
  legacyImage?: DailySpecial['image']
}

function resolveDailySpecial(record: DailySpecialRecord): DailySpecial | null {
  const title = record.titleOverride?.trim() || record.menuItem?.name?.trim() || record.legacyTitle?.trim()
  const description = record.descriptionOverride?.trim() || record.menuItem?.description?.trim() || record.legacyDescription?.trim()
  const pricePence = record.priceOverridePence ?? record.menuItem?.pricePence ?? record.legacyPricePence
  const image = record.imageOverride?.url ? record.imageOverride : record.menuItem?.image?.url ? record.menuItem.image : record.legacyImage
  if (!title || !description || !Number.isInteger(pricePence) || !image?.url || !image.alt) return null

  return {
    ...record,
    status: record.status === 'soldOut' || record.menuItem?.available === false ? 'soldOut' : 'active',
    title,
    description,
    pricePence: pricePence as number,
    image,
    dietaryNote: record.dietaryNote || record.menuItem?.dietaryNotes,
  }
}

export async function getActiveDailySpecials(): Promise<DailySpecial[]> {
  const now = new Date()
  const restaurantDate = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/London'}).format(now)
  if (!isWithinSchedule(await getRestaurantSchedule(), restaurantDate)) return []
  const dayName = new Intl.DateTimeFormat('en-GB', {weekday: 'long', timeZone: 'Europe/London'}).format(now).toLowerCase()
  const client = getSanityClient()
  if (!client) return []
  try {
    const records = await client.fetch(activeDailySpecialsQuery, {}, {next: {revalidate: 60, tags: ['sanity-daily-specials']}}) as DailySpecialRecord[]
    return records
      .map(resolveDailySpecial)
      .filter((special): special is DailySpecial => Boolean(special?._id))
      .filter((special) => !special.activeDays?.length || special.activeDays.includes(dayName))
      .map((special) => ({...special, callToAction: sanitisePublicLink(special.callToAction)}))
  } catch (error) {
    console.error("Sanity daily specials fetch failed; using menu fallbacks.", error instanceof Error ? error.name : 'UnknownError')
    return []
  }
}
