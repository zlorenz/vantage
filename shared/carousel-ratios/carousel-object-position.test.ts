/**
 *   npx tsx shared/carousel-ratios/carousel-object-position.test.ts
 */

import assert from 'node:assert/strict'

import {objectPositionFromHotspot} from './index'

function testDefaults() {
  assert.equal(objectPositionFromHotspot(undefined), '50% 50%')
  assert.equal(objectPositionFromHotspot({}), '50% 50%')
  assert.equal(objectPositionFromHotspot({x: Number.NaN, y: 0.2}), '50% 20%')
}

function testClampAndScale() {
  assert.equal(objectPositionFromHotspot({x: 0.25, y: 0.75}), '25% 75%')
  assert.equal(objectPositionFromHotspot({x: -0.1, y: 1.5}), '0% 100%')
  assert.equal(objectPositionFromHotspot({x: 0, y: 1}), '0% 100%')
}

testDefaults()
testClampAndScale()

console.log('carousel-object-position.test.ts: ok')
