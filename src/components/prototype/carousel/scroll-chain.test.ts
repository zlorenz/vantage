/**
 *   npx tsx src/components/prototype/carousel/scroll-chain.test.ts
 */

import assert from 'node:assert/strict';
import {isCarouselScrollActive} from './scroll-chain';

function testCarouselActiveWhenFlushInViewport() {
  assert.equal(isCarouselScrollActive({rootTop: 0, intersectionRatio: 1}), true);
  assert.equal(isCarouselScrollActive({rootTop: 64, intersectionRatio: 0.9}), true);
}

function testCarouselInactiveWhenPageHasScrolledPast() {
  assert.equal(isCarouselScrollActive({rootTop: -120, intersectionRatio: 0.75}), false);
  assert.equal(isCarouselScrollActive({rootTop: 0, intersectionRatio: 0.6}), false);
}

testCarouselActiveWhenFlushInViewport();
testCarouselInactiveWhenPageHasScrolledPast();

console.log('scroll-chain.test.ts: ok');
