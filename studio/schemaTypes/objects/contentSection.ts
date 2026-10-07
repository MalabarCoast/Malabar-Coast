import {defineArrayMember, defineField, defineType} from 'sanity'

export const contentSection = defineType({
  name: 'contentSection',
  title: 'Page section',
  type: 'object',
  fields: [
    defineField({name: 'internalName', title: 'Internal name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({name: 'body', title: 'Body', type: 'array', of: [defineArrayMember({type: 'block'})]}),
    defineField({name: 'image', title: 'Main image', type: 'imageWithAlt'}),
    defineField({name: 'secondaryImage', title: 'Secondary image', type: 'imageWithAlt'}),
    defineField({
      name: 'gallery',
      title: 'Image gallery',
      type: 'array',
      of: [defineArrayMember({type: 'imageWithAlt'})],
      validation: (rule) => rule.max(12),
    }),
    defineField({name: 'links', title: 'Links', type: 'array', of: [defineArrayMember({type: 'link'})]}),
    defineField({name: 'items', title: 'Supporting items', type: 'array', of: [defineArrayMember({type: 'object', fields: [
      defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'text', title: 'Description', type: 'text', rows: 3}),
      defineField({name: 'shortLabel', title: 'Short label or number', type: 'string'}),
    ], preview: {select: {title: 'title', subtitle: 'shortLabel'}}})]}),
    defineField({
      name: 'featuredDishes',
      title: 'Homepage featured dishes',
      description: 'Choose the three dishes and their card images shown in the Come to the table section.',
      type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'dish', title: 'Dish', type: 'reference', to: [{type: 'menuItem'}], validation: (rule) => rule.required()}),
        defineField({name: 'image', title: 'Card image', type: 'imageWithAlt', validation: (rule) => rule.required()}),
        defineField({name: 'note', title: 'Small caption', type: 'string'}),
      ], preview: {select: {title: 'dish.name', subtitle: 'note', media: 'image'}}})],
      validation: (rule) => rule.max(3),
    }),
    defineField({name: 'shortLabel', title: 'Short label or coordinate', type: 'string'}),
    defineField({name: 'note', title: 'Supporting note', type: 'text', rows: 2}),
    defineField({name: 'theme', title: 'Visual theme', type: 'string', options: {list: ['dark', 'light', 'green', 'copper']}}),
  ],
  preview: {select: {title: 'internalName', subtitle: 'heading', media: 'image'}},
})
