import {defineField, defineType} from 'sanity'

export const promotion = defineType({
  name: 'promotion',
  title: 'Promotion or offer',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Promotion title', type: 'string', validation: (rule) => rule.required().min(3).max(90)}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: [{title: 'Active', value: 'active'}, {title: 'Paused', value: 'paused'}], layout: 'radio'},
      initialValue: 'active',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'poster', title: 'Offer poster', type: 'imageWithAlt', validation: (rule) => rule.required()}),
    defineField({name: 'popupDesktopPoster', title: 'Homepage popup · desktop poster', type: 'imageWithAlt', description: 'Optional wide or landscape artwork for the homepage popup. Falls back to the offer poster.'}),
    defineField({name: 'popupMobilePoster', title: 'Homepage popup · mobile poster', type: 'imageWithAlt', description: 'Optional portrait artwork for phones. Falls back to the desktop popup poster, then the offer poster.'}),
    defineField({name: 'badge', title: 'Short badge', type: 'string', description: 'For example “Weekend offer” or “New”.', validation: (rule) => rule.max(35)}),
    defineField({name: 'summary', title: 'Short description', type: 'text', rows: 3, validation: (rule) => rule.max(220)}),
    defineField({name: 'offerCode', title: 'Offer code', type: 'string', validation: (rule) => rule.max(30)}),
    defineField({name: 'validityLabel', title: 'Public validity text', type: 'string', description: 'For example “Available Sunday to Thursday”.', validation: (rule) => rule.max(100)}),
    defineField({name: 'startsAt', title: 'Show from', type: 'datetime'}),
    defineField({
      name: 'endsAt',
      title: 'Show until',
      type: 'datetime',
      validation: (rule) => rule.custom((endsAt, context) => {
        const startsAt = context.document?.startsAt
        if (startsAt && endsAt && new Date(String(endsAt)) <= new Date(String(startsAt))) return 'Show until must be later than Show from.'
        return true
      }),
    }),
    defineField({name: 'showOnHomepage', title: 'Show in the homepage popup', type: 'boolean', description: 'Every enabled live offer becomes a slide in the homepage carousel.', initialValue: true}),
    defineField({name: 'displayDurationSeconds', title: 'Seconds before the next offer', type: 'number', description: 'Controls how long this offer stays visible before the carousel advances. Visitors can still skip manually.', initialValue: 7, validation: (rule) => rule.required().integer().min(4).max(15)}),
    defineField({name: 'callToAction', title: 'Booking button', type: 'link', description: 'Use /book-a-table when the offer should open the standard table-booking page.'}),
    defineField({name: 'terms', title: 'Terms and conditions', type: 'text', rows: 4, validation: (rule) => rule.max(800)}),
    defineField({name: 'displayOrder', title: 'Display and carousel order', type: 'number', description: 'Lower numbers appear first on the Offers page and in the homepage carousel.', initialValue: 100, validation: (rule) => rule.required().integer().min(0)}),
  ],
  orderings: [{title: 'Display order', name: 'displayOrder', by: [{field: 'displayOrder', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', status: 'status', startsAt: 'startsAt', media: 'poster'},
    prepare: ({title, status, startsAt, media}) => ({
      title,
      subtitle: `${status === 'active' ? 'Active' : 'Paused'}${startsAt ? ` · from ${new Date(startsAt).toLocaleDateString('en-GB')}` : ''}`,
      media,
    }),
  },
})
