import {useEffect, useState} from 'react'
import {set, unset, useClient, type ReferenceInputProps} from 'sanity'

type CampaignOption = {
  _id: string
  title: string
  slug?: string
  status: 'active' | 'paused' | 'archived'
}

const campaignsQuery = `
  *[_type == "specialDayCampaign" && !(_id in path("drafts.**"))]
    | order(status asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      "status": coalesce(status, "paused")
    }
`

export function SpecialDayCampaignSelect(props: ReferenceInputProps) {
  const client = useClient({apiVersion: '2025-02-19'})
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let subscribed = true

    client
      .fetch<CampaignOption[]>(campaignsQuery)
      .then((results) => {
        if (subscribed) setCampaigns(results)
      })
      .catch(() => {
        if (subscribed) setError('Campaigns could not be loaded. Use the reference picker below.')
      })
      .finally(() => {
        if (subscribed) setLoading(false)
      })

    return () => {
      subscribed = false
    }
  }, [client])

  if (error) {
    return (
      <div>
        {props.renderDefault(props)}
        <p style={{color: 'var(--card-muted-fg-color)', fontSize: 13, margin: '8px 0 0'}}>
          {error}
        </p>
      </div>
    )
  }

  const selectedId = props.value?._ref ?? ''

  return (
    <div>
      <select
        aria-label="Campaign used by the booking route"
        disabled={loading || props.readOnly}
        onChange={(event) => {
          const campaignId = event.currentTarget.value
          props.onChange(campaignId ? set({_type: 'reference', _ref: campaignId}) : unset())
        }}
        style={{
          appearance: 'auto',
          background: 'var(--card-bg-color)',
          border: '1px solid var(--card-border-color)',
          borderRadius: 3,
          color: 'inherit',
          cursor: loading || props.readOnly ? 'not-allowed' : 'pointer',
          font: 'inherit',
          minHeight: 44,
          padding: '0 12px',
          width: '100%',
        }}
        value={selectedId}
      >
        <option value="">{loading ? 'Loading campaigns…' : 'Choose a campaign…'}</option>
        {campaigns.map((campaign) => (
          <option key={campaign._id} value={campaign._id}>
            {campaign.title} — {campaign.status} — /special-days/{campaign.slug ?? 'missing-slug'}
          </option>
        ))}
      </select>

      <p style={{color: 'var(--card-muted-fg-color)', fontSize: 13, lineHeight: 1.5, margin: '8px 0 0'}}>
        Christmas and Onam can both remain Active. This selection decides which one replaces
        /book-a-table. Publish the Booking route after changing it.
      </p>
    </div>
  )
}
