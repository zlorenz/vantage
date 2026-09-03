/**
 * Search-only diacritic folding tests (Studio Content table).
 *   npx tsx sanity/tools/content/search-normalize.test.ts
 */

import assert from 'node:assert/strict'

import {normalizeCreditToken} from '../../../shared/crew-credits/normalize'
import {normalizeSearchText, searchTextIncludes} from './search-normalize'

function testCamDgMatchesCamStrokeD() {
  assert.equal(searchTextIncludes('Cam Đg', 'Cam Dg'), true)
  assert.equal(searchTextIncludes('Cam Dg', 'Cam Đg'), true)
  assert.equal(normalizeSearchText('Cam Đg'), 'cam dg')
  assert.equal(normalizeSearchText('Cam Dg'), 'cam dg')
}

function testNguyenMatchesNguyenWithDiacritics() {
  assert.equal(searchTextIncludes('Nguyễn', 'Nguyen'), true)
  assert.equal(searchTextIncludes('Hằng Nguyễn', 'Nguyen'), true)
  assert.equal(searchTextIncludes('Nguyễn Thúc Thùy Tiên', 'thuy tien'), true)
}

function testPlainSubstringUnchanged() {
  assert.equal(searchTextIncludes('Zacharia Lorenz', 'zach'), true)
  assert.equal(searchTextIncludes('Zacharia Lorenz', 'lorenz'), true)
  assert.equal(searchTextIncludes('Zacharia Lorenz', 'xyz'), false)
  assert.equal(searchTextIncludes('CAMP Productions', 'camp'), true)
}

function testSharedNormalizeCreditTokenStillDropsStrokeD() {
  // Prove we did not change linking normalization: Đ is still stripped, not → d.
  assert.equal(normalizeCreditToken('Cam Đg'), 'cam g')
  assert.equal(normalizeCreditToken('Cam Dg'), 'cam dg')
  assert.notEqual(normalizeCreditToken('Cam Đg'), normalizeCreditToken('Cam Dg'))
}

const tests = [
  testCamDgMatchesCamStrokeD,
  testNguyenMatchesNguyenWithDiacritics,
  testPlainSubstringUnchanged,
  testSharedNormalizeCreditTokenStillDropsStrokeD,
]

for (const test of tests) {
  test()
  console.log(`ok ${test.name}`)
}

console.log(`\n${tests.length} passed`)
