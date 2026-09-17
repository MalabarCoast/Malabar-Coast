import {createClient} from '@sanity/client'
import {menuItems} from '../app/lib/menu'

const apply = process.argv.includes('--apply')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const token = process.env.SANITY_API_TOKEN?.trim()

if (!projectId || !token) throw new Error('Sanity project configuration and SANITY_API_TOKEN are required.')

const client = createClient({projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw'})
const descriptionBySourceKey = new Map(menuItems.map((item) => [item.id, item.description]))

type MenuDocument = {_id: string; sourceKey?: string; name?: string; description?: string}

async function main() {
  const documents = await client.fetch<MenuDocument[]>(
    `*[_type == "menuItem" && defined(sourceKey)]{_id,sourceKey,name,description}`,
  )
  const catalogueDocuments = documents.filter((document) => document.sourceKey && descriptionBySourceKey.has(document.sourceKey))
  const updates = catalogueDocuments.filter((document) => !document.description?.trim())
  const missingSourceKeys = menuItems
    .map((item) => item.id)
    .filter((sourceKey) => !catalogueDocuments.some((document) => document.sourceKey === sourceKey))

  if (!apply) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      catalogueItems: menuItems.length,
      matchedDocuments: catalogueDocuments.length,
      descriptionsAlreadyWritten: catalogueDocuments.length - updates.length,
      descriptionsToWrite: updates.length,
      missingSourceKeys,
    }, null, 2))
    return
  }

  if (missingSourceKeys.length) throw new Error(`CMS menu items are missing for: ${missingSourceKeys.join(', ')}`)
  let transaction = client.transaction()
  for (const document of updates) {
    transaction = transaction.patch(document._id, {set: {description: descriptionBySourceKey.get(document.sourceKey!)}})
  }
  if (updates.length) await transaction.commit()

  const remaining = await client.fetch<Array<{_id: string; sourceKey: string}>>(
    `*[_type == "menuItem" && sourceKey in $sourceKeys && (!defined(description) || description == "")]{_id,sourceKey}`,
    {sourceKeys: menuItems.map((item) => item.id)},
  )
  if (remaining.length) throw new Error(`Descriptions remain blank for: ${remaining.map((item) => item.sourceKey).join(', ')}`)
  console.log(JSON.stringify({mode: 'applied-and-verified', descriptionsWritten: updates.length, catalogueItems: menuItems.length}, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Menu-description sync failed.')
  process.exit(1)
})
