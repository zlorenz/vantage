/**
 *   npx tsx src/components/prototype/carousel/scroll-chain.test.ts
 */

import assert from 'node:assert/strict';
import {
  boundaryLatchDirection,
  isBoundaryRelease,
  isCarouselReturnRecovery,
  isCarouselScrollActive,
  shouldKeepBoundaryLatch,
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

function testWheelKeepsPagingAtFirstAndLastWhileActive() {
  assert.equal(
    shouldReleaseWheelToPage({
      carouselActive: true,
      activeIndex: 0,
      lastIndex: 8,
      deltaY: -40,
    }),
    false,
  );
  assert.equal(
    shouldReleaseWheelToPage({
      carouselActive: true,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: 40,
    }),
    false,
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

function testKeysKeepPagingAtBoundariesWhileActive() {
  assert.equal(
    shouldReleaseKeyToPage({
      carouselActive: true,
      activeIndex: 8,
      lastIndex: 8,
      key: 'ArrowDown',
    }),
    false,
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

function testLatchDirectionFromDelta() {
  assert.equal(boundaryLatchDirection(20), 1);
  assert.equal(boundaryLatchDirection(-20), -1);
  assert.equal(boundaryLatchDirection(0), null);
}

function testKeepLatchOnlyWhileStillOnThatEdge() {
  assert.equal(
    shouldKeepBoundaryLatch({direction: 1, activeIndex: 8, lastIndex: 8}),
    true,
  );
  assert.equal(
    shouldKeepBoundaryLatch({direction: 1, activeIndex: 3, lastIndex: 8}),
    false,
  );
  assert.equal(
    shouldKeepBoundaryLatch({direction: -1, activeIndex: 0, lastIndex: 8}),
    true,
  );
  assert.equal(
    shouldKeepBoundaryLatch({direction: -1, activeIndex: 3, lastIndex: 8}),
    false,
  );
}

function testReturnRecoveryPeekAndStick() {
  assert.equal(
    isCarouselReturnRecovery({
      latchDirection: 1,
      carouselActive: false,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: -20,
      rootTop: 0,
      intersectionRatio: 1,
    }),
    true,
  );
}

function testReturnRecoveryContactVisibleIgnoresTopMin() {
  assert.equal(
    isCarouselScrollActive({rootTop: -100, intersectionRatio: 0.9}),
    false,
  );
  assert.equal(
    isCarouselReturnRecovery({
      latchDirection: null,
      carouselActive: false,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: -20,
      rootTop: -100,
      intersectionRatio: 0.9,
    }),
    true,
  );
}

function testReturnRecoveryDoesNotMatchDeepInContact() {
  assert.equal(
    isCarouselReturnRecovery({
      latchDirection: null,
      carouselActive: false,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: -20,
      rootTop: -400,
      intersectionRatio: 0.3,
    }),
    false,
  );
}

function testReturnRecoveryIgnoresDownwardAndActiveCarousel() {
  assert.equal(
    isCarouselReturnRecovery({
      latchDirection: 1,
      carouselActive: false,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: 20,
      rootTop: 0,
      intersectionRatio: 1,
    }),
    false,
  );
  assert.equal(
    isCarouselReturnRecovery({
      latchDirection: null,
      carouselActive: true,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: -20,
      rootTop: 0,
      intersectionRatio: 1,
    }),
    false,
  );
}

testCarouselActiveWhenFlushInViewport();
testCarouselInactiveWhenPageHasScrolledPast();
testWheelPagesInsideActiveCarousel();
testWheelReleasesWhenCarouselInactive();
testWheelKeepsPagingAtFirstAndLastWhileActive();
testKeysReleaseWhenCarouselInactive();
testKeysKeepPagingAtBoundariesWhileActive();
testBoundaryReleaseOnlyAtEnds();
testLatchDirectionFromDelta();
testKeepLatchOnlyWhileStillOnThatEdge();
testReturnRecoveryPeekAndStick();
testReturnRecoveryContactVisibleIgnoresTopMin();
testReturnRecoveryDoesNotMatchDeepInContact();
testReturnRecoveryIgnoresDownwardAndActiveCarousel();

console.log('scroll-chain.test.ts: ok');
