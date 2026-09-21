import {defineField, defineType} from 'sanity'
import {HexColorInput} from '../../components/HexColorInput'

const colourField = (name: string, title: string, initialValue: string) => defineField({
  name,
  title,
  type: 'string',
  initialValue,
  components: {input: HexColorInput},
  validation: (rule) => rule.required().regex(/^#[0-9A-F]{6}$/i, {name: 'six-digit hex colour'}),
})

export const campaignPalette = defineType({
  name: 'campaignPalette',
  title: 'Campaign colours',
  type: 'object',
  fields: [
    colourField('night', 'Hero background', '#061A1D'),
    colourField('evergreen', 'Primary green', '#174C38'),
    colourField('berry', 'Accent colour', '#931F2E'),
    colourField('gold', 'Highlight colour', '#F6C96F'),
    colourField('cream', 'Light background', '#F4EAD4'),
    colourField('ink', 'Text on light background', '#102D28'),
  ],
})
