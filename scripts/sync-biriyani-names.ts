import {createClient} from '@sanity/client'
import {menuItems} from '../app/lib/menu'

try {
  process.loadEnvFile?.('.env.local')
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

const apply = process.argv.includes('--apply')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const token = process.env.SANITY_API_TOKEN?.trim()

if (!projectId || !token) throw new Error('Sanity project configuration and SANITY_API_TOKEN are required.')

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-02-19',
  useCdn: false,
  perspective: 'raw',
})

const canonicalNames = new Map(
  menuItems
    .filter((item) => item.category === 'biriyani')
    .map((item) => [item.id, item.name]),
)

type StoredMenuItem = {_id: string; sourceKey: string; name?: string}

async function readItems() {
  return client.fetch<StoredMenuItem[]>(
    `*[_type == "menuItem" && sourceKey in $sourceKeys]{_id,sourceKey,name}`,
    {sourceKeys: [...canonicalNames.keys()]},
  )
}

async function main() {
  const storedItems = await readItems()
  const foundKeys = new Set(storedItems.map((item) => item.sourceKey))
  const missing = [...canonicalNames.keys()].filter((sourceKey) => !foundKeys.has(sourceKey))
  if (missing.length) throw new Error(`Missing biriyani catalogue items: ${missing.join(', ')}`)

  const changes = storedItems
    .map((item) => ({...item, nextName: canonicalNames.get(item.sourceKey)!}))
    .filter((item) => item.name !== item.nextName)

  if (!apply) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      dataset,
      changes: changes.map(({_id, sourceKey, name, nextName}) => ({_id, sourceKey, from: name, to: nextName})),
    }, null, 2))
    return
  }

  let transaction = client.transaction()
  for (const item of changes) transaction = transaction.patch(item._id, {set: {name: item.nextName}})
  if (changes.length) await transaction.commit()

  const verified = await readItems()
  const mismatches = verified.filter((item) => item.name !== canonicalNames.get(item.sourceKey))
  if (mismatches.length) {
    throw new Error(`Biriyani name verification failed for: ${mismatches.map((item) => item.sourceKey).join(', ')}`)
  }

  console.log(JSON.stringify({mode: 'applied-and-verified', dataset, updatedDocuments: changes.length}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Biriyani name sync failed.')
  process.exit(1)
})
