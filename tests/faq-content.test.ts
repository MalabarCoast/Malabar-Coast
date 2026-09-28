import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {faqItems} from '../app/lib/faq'

test('restaurant FAQs publish the corrected cuisine, bar and signature-dish answers', () => {
  const byId = new Map(faqItems.map((faq) => [faq.id, faq]))

  assert.equal(faqItems.length, 21)
  assert.match(byId.get('what-cuisine')?.answer || '', /Indian cuisine from across the country/)
  assert.match(byId.get('what-cuisine')?.answer || '', /not limited to Kerala dishes/)
  assert.match(byId.get('licensed-alcohol')?.answer || '', /licensed restaurant and bar/)
  for (const dish of ['Chicken Tikka', 'Peshwari Naan', 'Chicken Chasni', 'Mughlai Korma']) {
    assert.match(byId.get('signature-dishes')?.answer || '', new RegExp(dish))
  }
})

test('dietary FAQs explain practical vegan choices and the supplied gluten marker safely', () => {
  const byId = new Map(faqItems.map((faq) => [faq.id, faq]))
  const vegan = byId.get('vegan-options')?.answer || ''
  const gluten = byId.get('gluten-free-options')?.answer || ''

  assert.match(vegan, /Vegan options are available/)
  assert.match(vegan, /Masala Dosa/)
  assert.match(vegan, /confirm ingredients and shared-fryer preparation/)
  assert.match(gluten, /G to mark dishes that contain gluten/)
  assert.match(gluten, /not a cross-contact guarantee/)
  assert.doesNotMatch(gluten, /Not yet/)
})

test('The Kerala Suite booking FAQ is named, answered and safely synchronised', async () => {
  const hallBooking = faqItems.find((faq) => faq.id === 'hall-enquiries')
  const syncScript = await readFile(new URL('../scripts/sync-faq-content.ts', import.meta.url), 'utf8')

  assert.equal(hallBooking?.question, 'How can I book The Kerala Suite at Malabar Coast?')
  assert.match(hallBooking?.answer || '', /event enquiry form/)
  assert.match(hallBooking?.answer || '', /starts an enquiry rather than an automatic booking/)
  assert.match(syncScript, /legacyQuestions/)
  assert.match(syncScript, /client\.transaction\(\)/)
  assert.match(syncScript, /applied-and-verified/)
})
