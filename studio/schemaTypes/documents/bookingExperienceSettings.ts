import {defineField, defineType} from 'sanity'
import {SpecialDayCampaignSelect} from '../../components/SpecialDayCampaignSelect'

export const bookingExperienceSettings = defineType({
  name: 'bookingExperienceSettings',
  title: 'Booking route',
  type: 'document',
  fields: [
    defineField({
      name: 'bookingMode',
      title: 'Which booking page should guests use?',
      type: 'string',
      description: 'This one switch controls every link that points to /book-a-table.',
      options: {list: [{title: 'Regular booking page', value: 'regular'}, {title: 'Selected special-day page', value: 'special'}], layout: 'radio'},
      initialValue: 'regular',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'activeCampaign',
      title: 'Campaign used by /book-a-table',
      type: 'reference',
      description: 'Christmas and Onam may both be Active. Choose the single page guests should see, then publish this Booking route.',
      to: [{type: 'specialDayCampaign'}],
      components: {input: SpecialDayCampaignSelect},
      hidden: ({document}) => document?.bookingMode !== 'special',
      validation: (rule) => rule.custom((value, context) => (context.document?.bookingMode === 'special' && !value) ? 'Choose the page guests should see.' : true),
    }),
    defineField({name: 'note', title: 'Internal note', type: 'text', rows: 3, description: 'Optional handover note for the restaurant team.'}),
  ],
  preview: {prepare: () => ({title: 'Booking route', subtitle: 'Regular or special-day booking switch'})},
})
