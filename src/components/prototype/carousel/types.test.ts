/**
 *   npx tsx src/components/prototype/carousel/types.test.ts
 */

import assert from 'node:assert/strict';
import {
  isInPlayerWindow,
  shouldMountCarouselPlayer,
  wrapSlideIndex,
} from './types';

function testWrapSlideIndexLoops() {
  assert.equal(wrapSlideIndex(9, 9), 0);
  assert.equal(wrapSlideIndex(-1, 9), 8);
  assert.equal(wrapSlideIndex(0, 9), 0);
  assert.equal(wrapSlideIndex(8, 9), 8);
  assert.equal(wrapSlideIndex(1, 1), 0);
  assert.equal(wrapSlideIndex(4, 0), 0);
}

function testPlayerWindowWrapsAtEnds() {
  assert.equal(isInPlayerWindow(0, 8, 9), true);
  assert.equal(isInPlayerWindow(8, 0, 9), true);
  assert.equal(isInPlayerWindow(7, 0, 9), false);
  assert.equal(isInPlayerWindow(1, 8, 9), false);
  assert.equal(isInPlayerWindow(3, 3, 9), true);
  assert.equal(isInPlayerWindow(4, 3, 9), true);
}

function testMountActiveImmediatelyAndWrapNeighbor() {
  assert.equal(shouldMountCarouselPlayer(0, 0, 8, 9), true);
  assert.equal(shouldMountCarouselPlayer(8, 0, 8, 9), true);
  assert.equal(shouldMountCarouselPlayer(1, 0, 8, 9), false);
  assert.equal(shouldMountCarouselPlayer(1, 0, 0, 9), true);
}

testWrapSlideIndexLoops();
testPlayerWindowWrapsAtEnds();
testMountActiveImmediatelyAndWrapNeighbor();

console.log('types.test.ts: ok');
