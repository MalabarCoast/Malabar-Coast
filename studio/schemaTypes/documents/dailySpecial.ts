import {defineArrayMember, defineField, defineType} from 'sanity'

const weekdayOptions = [
  {title: 'Monday', value: 'monday'},
  {title: 'Tuesday', value: 'tuesday'},
  {title: 'Wednesday', value: 'wednesday'},
  {title: 'Thursday', value: 'thursday'},
  {title: 'Friday', value: 'friday'},
  {title: 'Saturday', value: 'saturday'},
  {title: 'Sunday', value: 'sunday'},
]

export const dailySpecial = defineType({
  name: 'dailySpecial',
  title: "Today's special",
  type: 'document',
  fieldsets: [
    {name: 'overrides', title: 'Optional special-only changes', options: {collapsible: true, collapsed: true}},
    {name: 'legacy', title: 'Legacy copied dish data', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'menuItem',
      title: 'Choose a dish from the menu catalogue',
      type: 'reference',
      to: [{type: 'menuItem'}],
      options: {disableNew: true, filter: 'published != false'},
      description: 'Search all menu items here. The dish name, description, image, normal price, dietary details and ordering availability stay synced with the menu item.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Availability',
      type: 'string',
      options: {list: [
        {title: 'Available', value: 'active'},
        {title: 'Sold out', value: 'soldOut'},
        {title: 'Paused', value: 'paused'},
      ], layout: 'radio'},
      initialValue: 'active',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'badge', title: 'Short label', type: 'string', description: 'For example “Today only” or “Chef’s pick”.', validation: (rule) => rule.max(35)}),
    defineField({name: 'titleOverride', title: 'Special name override', type: 'string', fieldset: 'overrides', description: 'Leave empty to use the menu item name.', validation: (rule) => rule.min(3).max(90)}),
    defineField({name: 'descriptionOverride', title: 'Special description override', type: 'text', rows: 3, fieldset: 'overrides', description: 'Leave empty to use the menu item description.', validation: (rule) => rule.max(260)}),
    defineField({name: 'imageOverride', title: 'Special image override', type: 'imageWithAlt', fieldset: 'overrides', description: 'Leave empty to use the menu item image.'}),
    defineField({name: 'priceOverridePence', title: 'Special price override in pennies', type: 'number', fieldset: 'overrides', description: 'Leave empty to use the menu price. If guests can order this dish online, keep its catalogue price aligned with this amount.', validation: (rule) => rule.integer().min(0)}),
    defineField({name: 'priceNote', title: 'Optional price note', type: 'string', description: 'For example “while stocks last”.', validation: (rule) => rule.max(70)}),
    defineField({name: 'dietaryNote', title: 'Dietary or allergen note', type: 'string', validation: (rule) => rule.max(140)}),
    defineField({name: 'activeDays', title: 'Days available', type: 'array', of: [defineArrayMember({type: 'string'})], options: {list: weekdayOptions}, validation: (rule) => rule.unique()}),
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
    defineField({name: 'callToAction', title: 'Optional action', type: 'link'}),
    defineField({name: 'displayOrder', title: 'Display order', type: 'number', initialValue: 100, validation: (rule) => rule.required().integer().min(0)}),
    defineField({name: 'title', title: 'Copied dish name', type: 'string', fieldset: 'legacy', deprecated: {reason: 'The name now comes from the selected menu item. Use the special name override only when it must differ.'}, readOnly: true, hidden: ({value}) => value === undefined}),
    defineField({name: 'slug', title: 'Legacy slug', type: 'slug', fieldset: 'legacy', deprecated: {reason: 'Today’s specials are now identified by their linked menu item.'}, readOnly: true, hidden: ({value}) => value === undefined}),
    defineField({name: 'image', title: 'Copied dish image', type: 'imageWithAlt', fieldset: 'legacy', deprecated: {reason: 'The image now comes from the selected menu item. Use the special image override only when it must differ.'}, readOnly: true, hidden: ({value}) => value === undefined}),
    defineField({name: 'description', title: 'Copied dish description', type: 'text', rows: 3, fieldset: 'legacy', deprecated: {reason: 'The description now comes from the selected menu item. Use the special description override only when it must differ.'}, readOnly: true, hidden: ({value}) => value === undefined}),
    defineField({name: 'pricePence', title: 'Copied dish price', type: 'number', fieldset: 'legacy', deprecated: {reason: 'The price now comes from the selected menu item. Use the special price override only when it must differ.'}, readOnly: true, hidden: ({value}) => value === undefined}),
  ],
  orderings: [{title: 'Display order', name: 'displayOrder', by: [{field: 'displayOrder', direction: 'asc'}]}],
  preview: {
    select: {menuTitle: 'menuItem.name', overrideTitle: 'titleOverride', legacyTitle: 'title', status: 'status', menuPrice: 'menuItem.pricePence', overridePrice: 'priceOverridePence', legacyPrice: 'pricePence', overrideMedia: 'imageOverride', menuMedia: 'menuItem.image', legacyMedia: 'image'},
    prepare: ({menuTitle, overrideTitle, legacyTitle, status, menuPrice, overridePrice, legacyPrice, overrideMedia, menuMedia, legacyMedia}) => {
      const price = overridePrice ?? menuPrice ?? legacyPrice
      return {
        title: overrideTitle || menuTitle || legacyTitle || 'Choose a menu item',
        subtitle: `${status === 'active' ? 'Available' : status === 'soldOut' ? 'Sold out' : 'Paused'} · ${typeof price === 'number' ? `£${(price / 100).toFixed(2)}` : 'Price needed'}`,
        media: overrideMedia || menuMedia || legacyMedia,
      }
    },
  },
})
