import {redirect} from 'next/navigation'
import {getBookingExperienceSettings, isCampaignLive} from '@/sanity/lib/special-days'

export const dynamic = 'force-dynamic'

export default async function SpecialDaysPage() {
  const settings = await getBookingExperienceSettings()
  if (settings.bookingMode === 'special' && settings.activeCampaign?.slug && isCampaignLive(settings.activeCampaign)) {
    redirect(`/special-days/${settings.activeCampaign.slug}`)
  }
  redirect('/book-a-table')
}
