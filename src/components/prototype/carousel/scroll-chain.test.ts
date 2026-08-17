/**
 *   npx tsx src/components/prototype/carousel/scroll-chain.test.ts
 */

import assert from 'node:assert/strict';
import {
  isBoundaryRelease,
  isCarouselScrollActive,
  shouldReleaseKeyToPage,
  shouldReleaseWheelToPage,
} from './scroll-chain';

function testCarouselActiveWhenFlushInViewport() {
  assert.equal(isCarouselScrollActive({rootTop: 0, intersectionRatio: 1}), true);
  assert.equal(isCarouselScrollActive({rootTop: 64, intersectionRatio: 0.9}), true);
}

function testCarouselInactiveWhenPageHasScrolledPast() {
  assert.equal(isCarouselScrollActive({rootTop: -120, intersectionRatio: 0.75}), false);
  assert.equal(isCarouselScrollActive({rootTop: 0, intersectionRatio: 0.6}), false);
}

function testWheelPagesInsideActiveCarousel() {
  assert.equal(
    shouldReleaseWheelToPage({
      carouselActive: true,
      activeIndex: 2,
      lastIndex: 8,
      deltaY: 40,
    }),
    false,
  );
}

function testWheelReleasesWhenCarouselInactive() {
  assert.equal(
    shouldReleaseWheelToPage({
      carouselActive: false,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: -40,
    }),
    true,
  );
}

function testWheelChainsAtFirstAndLastWhileActive() {
  assert.equal(
    shouldReleaseWheelToPage({
      carouselActive: true,
      activeIndex: 0,
      lastIndex: 8,
      deltaY: -40,
    }),
    true,
  );
  assert.equal(
    shouldReleaseWheelToPage({
      carouselActive: true,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: 40,
    }),
    true,
  );
}

function testKeysReleaseWhenCarouselInactive() {
  assert.equal(
    shouldReleaseKeyToPage({
      carouselActive: false,
      activeIndex: 3,
      lastIndex: 8,
      key: 'ArrowDown',
    }),
    true,
  );
}

function testKeysMatchWheelAtBoundariesWhileActive() {
  assert.equal(
    shouldReleaseKeyToPage({
      carouselActive: true,
      activeIndex: 8,
      lastIndex: 8,
      key: 'ArrowDown',
    }),
    true,
  );
  assert.equal(
    shouldReleaseKeyToPage({
      carouselActive: true,
      activeIndex: 3,
      lastIndex: 8,
      key: 'ArrowDown',
    }),
    false,
  );
}

function testBoundaryReleaseOnlyAtEnds() {
  assert.equal(
    isBoundaryRelease({activeIndex: 8, lastIndex: 8, deltaY: 20}),
    true,
  );
  assert.equal(
    isBoundaryRelease({activeIndex: 8, lastIndex: 8, deltaY: -20}),
    false,
  );
  assert.equal(
    isBoundaryRelease({activeIndex: 0, lastIndex: 8, deltaY: -20}),
    true,
  );
  assert.equal(
    isBoundaryRelease({activeIndex: 0, lastIndex: 8, deltaY: 20}),
    false,
  );
  assert.equal(
    isBoundaryRelease({activeIndex: 3, lastIndex: 8, deltaY: 20}),
    false,
  );
}

testCarouselActiveWhenFlushInViewport();
testCarouselInactiveWhenPageHasScrolledPast();
testWheelPagesInsideActiveCarousel();
testWheelReleasesWhenCarouselInactive();
testWheelChainsAtFirstAndLastWhileActive();
testKeysReleaseWhenCarouselInactive();
testKeysMatchWheelAtBoundariesWhileActive();
testBoundaryReleaseOnlyAtEnds();

console.log('scroll-chain.test.ts: ok');
