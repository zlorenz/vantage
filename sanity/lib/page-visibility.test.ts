/**
 * Unit checks for page-visibility helpers (no Sanity runtime required).
 *
 * Usage: npx tsx lib/page-visibility.test.ts
 */

import assert from 'node:assert/strict'

import {
  hideGroupUnlessPageSlug,
  hideUnlessPageSlug,
  isPageSlug,
  isStudioHiddenPageSlug,
  pageSlug,
  STUDIO_HIDDEN_PAGE_SLUGS,
} from './page-visibility'

assert.equal(pageSlug({slug: {current: 'home'}}), 'home')
assert.equal(pageSlug({slug: {current: '  about  '}}), 'about')
assert.equal(pageSlug({slug: {current: ''}}), undefined)
assert.equal(pageSlug({}), undefined)
assert.equal(pageSlug(null), undefined)

assert.equal(isPageSlug({slug: {current: 'home'}}, 'home'), true)
assert.equal(isPageSlug({slug: {current: 'home'}}, ['home', 'about']), true)
assert.equal(isPageSlug({slug: {current: 'work'}}, 'home'), false)
assert.equal(isPageSlug({}, 'home'), false)

assert.deepEqual([...STUDIO_HIDDEN_PAGE_SLUGS], ['work-internal'])
assert.equal(isStudioHiddenPageSlug('work-internal'), true)
assert.equal(isStudioHiddenPageSlug('about'), false)
assert.equal(isStudioHiddenPageSlug(null), false)

const hideHome = hideUnlessPageSlug('home')
assert.equal(hideHome({document: {slug: {current: 'home'}}}), false)
assert.equal(hideHome({document: {slug: {current: 'about'}}}), true)
assert.equal(hideHome({document: {}}), true)

const hideHomeGroup = hideGroupUnlessPageSlug('home')
assert.equal(hideHomeGroup({value: {slug: {current: 'home'}}}), false)
assert.equal(hideHomeGroup({document: {slug: {current: 'about'}}}), true)

const hideAboutOrHome = hideUnlessPageSlug(['home', 'about'])
assert.equal(hideAboutOrHome({document: {slug: {current: 'about'}}}), false)
assert.equal(hideAboutOrHome({document: {slug: {current: 'news'}}}), true)

console.log('page-visibility.test.ts: ok')
