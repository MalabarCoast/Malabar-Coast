import {createClient} from '@sanity/client'
import {faqItems} from '../app/lib/faq'

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

const client = createClient({projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw'})

const legacyQuestions: Record<string, readonly string[]> = {
  'licensed-alcohol': ['Does the Malabar Coast serve alcohol?'],
  'private-hall': ['Does Malabar Coast have a private event hall?'],
  'hall-facilities': ['Which facilities are included in the private hall?'],
  'hall-enquiries': ['How can I book the Malabar Coast hall?'],
}

const categoryFor = (id: string) => ['private-hall', 'hall-facilities', 'hall-enquiries'].includes(id)
  ? 'The Kerala Suite'
  : 'Restaurant'

const targetFaqIds = new Set([
  'what-cuisine',
  'licensed-alcohol',
  'signature-dishes',
  'vegan-options',
  'gluten-free-options',
  'food-allergies',
  'private-hall',
  'hall-facilities',
  'hall-enquiries',
])

const targetFaqs = faqItems
  .map((faq, displayOrder) => ({faq, displayOrder}))
  .filter(({faq}) => targetFaqIds.has(faq.id))

async function main() {
  const candidateQuestions = targetFaqs.flatMap(({faq}) => [faq.question, ...(legacyQuestions[faq.id] || [])])
  const existing = await client.fetch<Array<{_id: string; question: string; answer?: string; published?: boolean}>>(
    `*[_type == "faqItem"]{_id,question,answer,published}`,
  )
  const unmatched = existing.filter((document) => !document._id.startsWith('drafts.') && !candidateQuestions.includes(document.question))

  const changes = targetFaqs.map(({faq, displayOrder}) => {
    const acceptedQuestions = new Set([faq.question, ...(legacyQuestions[faq.id] || [])])
    const matches = existing.filter((document) => acceptedQuestions.has(document.question))
    return {
      id: faq.id,
      question: faq.question,
      operation: matches.length ? 'update' : 'create',
      documents: matches.map((document) => document._id),
      displayOrder,
    }
  })

  if (!apply) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      targetedFaqs: targetFaqs.length,
      creates: changes.filter((change) => change.operation === 'create').map((change) => change.question),
      updates: changes.filter((change) => change.operation === 'update').map((change) => change.question),
      renamedQuestions: Object.keys(legacyQuestions).length,
      unmatchedPublishedDocuments: unmatched.map((document) => ({id: document._id, question: document.question, published: document.published !== false})),
    }, null, 2))
    return
  }

  let transaction = client.transaction()
  for (const {faq, displayOrder} of targetFaqs) {
    const acceptedQuestions = new Set([faq.question, ...(legacyQuestions[faq.id] || [])])
    const matches = existing.filter((document) => acceptedQuestions.has(document.question))
    const document = {
      question: faq.question,
      answer: faq.answer,
      category: categoryFor(faq.id),
      displayOrder,
      published: true,
    }
    if (matches.length) {
      for (const match of matches) transaction = transaction.patch(match._id, {set: document})
    } else {
      transaction = transaction.create({_type: 'faqItem', ...document})
    }
  }
  await transaction.commit()

  const verified = await client.fetch<Array<{question: string; answer: string; category?: string; displayOrder: number}>>(
    `*[_type == "faqItem" && published != false && !(_id in path("drafts.**"))] | order(displayOrder asc){question,answer,category,displayOrder}`,
  )
  const missingOrMismatched = targetFaqs.filter(({faq, displayOrder}) => !verified.some((document) => (
    document.question === faq.question
    && document.answer === faq.answer
    && document.category === categoryFor(faq.id)
    && document.displayOrder === displayOrder
  )))
  const staleQuestions = Object.values(legacyQuestions).flat().filter((question) => verified.some((document) => document.question === question))
  if (missingOrMismatched.length || staleQuestions.length) {
    throw new Error(`FAQ verification failed. Missing or mismatched: ${missingOrMismatched.map(({faq}) => faq.id).join(', ') || 'none'}; stale questions: ${staleQuestions.join(', ') || 'none'}`)
  }

  console.log(JSON.stringify({
    mode: 'applied-and-verified',
    faqCount: verified.length,
    alignedFaqs: targetFaqs.length,
    alcoholQuestion: 'Does Malabar Coast serve alcohol?',
    eventSpaceName: 'The Kerala Suite',
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'FAQ synchronisation failed.')
  process.exit(1)
})
