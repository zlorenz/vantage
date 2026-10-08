/**
 *   npx tsx shared/video-formats/video-formats.test.ts
 */

import assert from 'node:assert/strict'
import {
  isKeyVisualVideoFormatTerm,
  withoutKeyVisualVideoFormats,
} from './index'

function testDetectsSlugAndTitleVariants() {
  assert.equal(isKeyVisualVideoFormatTerm({slug: 'key-visual'}), true)
  assert.equal(isKeyVisualVideoFormatTerm({title: 'Key Visual'}), true)
  assert.equal(isKeyVisualVideoFormatTerm({title: 'Key Visuals'}), true)
  assert.equal(isKeyVisualVideoFormatTerm({title: 'KEY VISUALS'}), true)
  assert.equal(isKeyVisualVideoFormatTerm({title: 'Product Film'}), false)
}

function testFiltersOverlayList() {
  const kept = withoutKeyVisualVideoFormats([
    {title: 'Product Film', slug: 'product-film'},
    {title: 'Key Visuals', slug: 'key-visual'},
    {title: 'TVC', slug: 'tvc'},
  ])
  assert.deepEqual(
    kept.map((term) => term.title),
    ['Product Film', 'TVC'],
  )
}

const tests = [testDetectsSlugAndTitleVariants, testFiltersOverlayList]

for (const test of tests) {
  test()
  console.log(`ok ${test.name}`)
}

console.log(`\n${tests.length} passed`)
