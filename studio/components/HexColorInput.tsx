import {set, type StringInputProps} from 'sanity'

const FALLBACK_COLOUR = '#0b2923'
const HEX_COLOUR = /^#[0-9a-f]{6}$/i

export function HexColorInput(props: StringInputProps) {
  const pickerValue = HEX_COLOUR.test(props.value || '') ? props.value : FALLBACK_COLOUR

  return (
    <div style={{display: 'grid', gridTemplateColumns: '3.5rem 1fr', gap: '0.75rem', alignItems: 'center'}}>
      <input
        aria-label={`${props.schemaType.title || 'Colour'} picker`}
        type="color"
        value={pickerValue}
        onChange={(event) => props.onChange(set(event.currentTarget.value.toUpperCase()))}
        style={{width: '3.5rem', height: '2.5rem', padding: '0.15rem', border: '1px solid #cad1d8', borderRadius: '0.25rem', background: 'white'}}
      />
      {props.renderDefault(props)}
    </div>
  )
}
