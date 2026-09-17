import {defineArrayMember, defineField, defineType} from 'sanity'

const indianFoodDestinations = [
  {title: 'Delhi', value: 'Delhi'},
  {title: 'Amritsar', value: 'Amritsar'},
  {title: 'Mumbai (Bombay)', value: 'Mumbai (Bombay)'},
  {title: 'Kashmir', value: 'Kashmir'},
  {title: 'Hyderabad', value: 'Hyderabad'},
  {title: 'Lucknow', value: 'Lucknow'},
]

export const menuPage = defineType({
  name: 'menuPage',
  title: 'Menu page',
  type: 'document',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'headingLineOne', title: 'Heading line one', type: 'string'}),
    defineField({name: 'headingLineTwo', title: 'Heading line two', type: 'string'}),
    defineField({name: 'introduction', title: 'Introduction', type: 'text', rows: 4}),
    defineField({name: 'journeyLinkLabel', title: 'Journey link label', type: 'string'}),
    defineField({name: 'manifestEyebrow', title: 'Full menu eyebrow', type: 'string'}),
    defineField({name: 'manifestHeading', title: 'Full menu heading', type: 'string'}),
    defineField({name: 'manifestIntroduction', title: 'Full menu introduction', type: 'text', rows: 3}),
    defineField({name: 'dietaryNotice', title: 'Dietary and allergen notice', type: 'text', rows: 4}),
    defineField({name: 'alcoholNotice', title: 'Alcohol notice', type: 'text', rows: 3}),
    defineField({
      name: 'voyageStops',
      title: 'Six Indian food destinations',
      description: 'Choose six places across India and connect each one to an existing dish from the menu.',
      type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'dish', title: 'Dish', type: 'reference', to: [{type: 'menuItem'}], validation: (rule) => rule.required()}),
        defineField({name: 'area', title: 'Indian destination', type: 'string', options: {list: indianFoodDestinations, layout: 'dropdown'}, validation: (rule) => rule.required()}),
        defineField({name: 'port', title: 'Former port name', type: 'string', deprecated: {reason: 'Use Indian destination instead.'}, readOnly: true, hidden: ({value}) => value === undefined, initialValue: undefined}),
        defineField({name: 'region', title: 'Food landscape', type: 'string'}),
        defineField({name: 'coordinates', title: 'Coordinates', type: 'string'}),
        defineField({name: 'yearLabel', title: 'Area note', type: 'string'}),
        defineField({name: 'courseLabel', title: 'Course label', type: 'string'}),
        defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
        defineField({name: 'description', title: 'Story', type: 'text', rows: 4}),
      ], preview: {
        select: {area: 'area', formerPort: 'port', subtitle: 'dish.name', media: 'image'},
        prepare: ({area, formerPort, subtitle, media}) => ({title: area || formerPort || 'Indian destination', subtitle, media}),
      }})],
      validation: (rule) => rule.required().length(6).error('Add exactly six Indian food destinations.'),
    }),
    defineField({name: 'seo', title: 'Search and sharing', type: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Menu page'})},
})
