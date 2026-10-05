import {redirect} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SpecialDaysPage() {
  redirect('/book-a-table')
}
