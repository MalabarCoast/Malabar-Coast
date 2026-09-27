import {defineArrayMember, defineField, defineType} from 'sanity'

const indianFoodDestinations = [
  {title: 'Kochi · Kerala', value: 'Kochi'},
  {title: 'Kozhikode · Kerala', value: 'Kozhikode'},
  {title: 'Mangaluru · Karnataka', value: 'Mangaluru'},
  {title: 'Mumbai · Maharashtra', value: 'Mumbai'},
  {title: 'Surat · Gujarat', value: 'Surat'},
  {title: 'Chennai · Tamil Nadu', value: 'Chennai'},
]
const indianFoodDestinationValues = new Set(indianFoodDestinations.map((destination) => destination.value))

const rejectLegacyRouteCopy = (value: string | undefined) => !value || !/one kerala|explore kerala|six kerala food regions/i.test(value) || 'Replace the previous journey copy with the port-city menu story.'

export const menuPage = defineType({
  name: 'menuPage',
  title: 'Menu page',
  type: 'document',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'headingLineOne', title: 'Heading line one', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'headingLineTwo', title: 'Heading line two', type: 'string', validation: (rule) => rule.required().custom(rejectLegacyRouteCopy)}),
    defineField({name: 'introduction', title: 'Introduction', type: 'text', rows: 4, validation: (rule) => rule.required().max(320)}),
    defineField({name: 'journeyLinkLabel', title: 'Journey link label', type: 'string', validation: (rule) => rule.required().custom(rejectLegacyRouteCopy)}),
    defineField({name: 'manifestEyebrow', title: 'Full menu eyebrow', type: 'string'}),
    defineField({name: 'manifestHeading', title: 'Full menu heading', type: 'string'}),
    defineField({name: 'manifestIntroduction', title: 'Full menu introduction', type: 'text', rows: 3}),
    defineField({name: 'dietaryNotice', title: 'Dietary and allergen notice', type: 'text', rows: 4}),
    defineField({name: 'alcoholNotice', title: 'Alcohol notice', type: 'text', rows: 3}),
    defineField({
      name: 'voyageStops',
      title: 'Six Indian port-city food stories',
      description: 'Connect six Indian port cities, including Kerala, Gujarat, Mumbai and Chennai, to real dishes served by the restaurant.',
      type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'dish', title: 'Dish', type: 'reference', to: [{type: 'menuItem'}], validation: (rule) => rule.required()}),
        defineField({name: 'area', title: 'Indian port city', type: 'string', options: {list: indianFoodDestinations, layout: 'dropdown'}, validation: (rule) => rule.required()}),
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
      validation: (rule) => rule.required().length(6).custom((stops) => {
        if (!stops) return true
        const areas = (stops as Array<{area?: string}>).map((stop) => stop?.area).filter(Boolean)
        if (areas.some((area) => !indianFoodDestinationValues.has(area as string))) return 'Use one of the six approved Indian port cities.'
        if (new Set(areas).size !== areas.length) return 'Each Indian destination can appear only once.'
        return true
      }).error('Add exactly six distinct Indian food destinations.'),
    }),
    defineField({name: 'seo', title: 'Search and sharing', type: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Menu page'})},
})
