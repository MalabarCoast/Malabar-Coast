import {writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {categoryDetails, menuAllergenEvidence, menuItems} from '../app/lib/menu'

const regulatedAllergens = [
  'celery',
  'cereals containing gluten',
  'crustaceans',
  'eggs',
  'fish',
  'lupin',
  'milk',
  'molluscs',
  'mustard',
  'nuts',
  'peanuts',
  'sesame',
  'soya',
  'sulphites',
] as const

const columns = [
  'sourceKey',
  'category',
  'itemName',
  'allergenStatus',
  ...regulatedAllergens,
  'crossContaminationNotes',
  'evidenceSource',
  'approvedBy',
  'approvedAt',
]

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

const rows = menuItems.map((item) => {
  const declared = new Set(item.allergens)
  const isSourceConfirmed = item.allergenReviewStatus === 'confirmed'
  return [
    item.id,
    categoryDetails[item.category]?.title ?? item.category,
    item.name,
    item.allergenReviewStatus,
    ...regulatedAllergens.map((allergen) => declared.has(allergen) ? 'contains' : ''),
    item.allergenNotes ?? '',
    isSourceConfirmed ? menuAllergenEvidence.source : '',
    isSourceConfirmed ? menuAllergenEvidence.reviewedBy : '',
    isSourceConfirmed ? menuAllergenEvidence.reviewedAt : '',
  ]
})

async function main() {
  const output = [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
  const outputPath = resolve('docs/MENU_ALLERGEN_REGISTER.csv')

  await writeFile(outputPath, output, 'utf8')
  console.log(`Created ${outputPath} with ${rows.length} menu items.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Allergen register export failed.')
  process.exitCode = 1
})
