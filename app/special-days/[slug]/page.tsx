import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {getBookingSettings} from '../../lib/booking-store'
import {getRestaurantSchedule} from '../../lib/schedule-store'
import {isCampaignLive, getSpecialDayCampaign} from '@/sanity/lib/special-days'
import {SpecialDayBookingExperience} from '../../christmas-booking/christmas-booking-experience'
import {getServiceAvailability} from '../../lib/service-availability-store'
import {publicServiceAvailability} from '../../lib/service-availability'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const {slug} = await params
  const campaign = await getSpecialDayCampaign(slug)
  if (!campaign || !isCampaignLive(campaign)) return {title: 'Special booking page', robots: {index: false, follow: false}}
  const sharingImage = campaign.seo?.image || campaign.desktopHero
  return {
    title: campaign.seo?.title || campaign.title,
    description: campaign.seo?.description || campaign.heroText,
    alternates: {canonical: `/special-days/${campaign.slug}`},
    robots: campaign.seo?.noIndex ? {index: false, follow: true} : undefined,
    openGraph: {title: campaign.seo?.title || campaign.title, description: campaign.seo?.description || campaign.heroText, images: [{url: sharingImage.url, alt: sharingImage.alt}]},
  }
}

export default async function SpecialDayPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const [campaign, settings, schedule, serviceAvailability] = await Promise.all([getSpecialDayCampaign(slug), getBookingSettings(), getRestaurantSchedule(), getServiceAvailability()])
  if (!campaign || !isCampaignLive(campaign)) notFound()
  return <SpecialDayBookingExperience campaign={campaign} settings={settings} schedule={schedule} availability={publicServiceAvailability(serviceAvailability).table}/>
}
