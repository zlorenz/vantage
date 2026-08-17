/**
 *   npx tsx src/components/prototype/carousel/scroll-chain.test.ts
 */

import assert from 'node:assert/strict';
import {shouldReleaseKeyToPage, shouldReleaseWheelToPage} from './scroll-chain';

function testWheelPagesInsideCarousel() {
  assert.equal(
    shouldReleaseWheelToPage({
      pageScrollY: 0,
      activeIndex: 2,
      lastIndex: 8,
      deltaY: 40,
    }),
    false,
  );
  assert.equal(
    shouldReleaseWheelToPage({
      pageScrollY: 0,
      activeIndex: 2,
      lastIndex: 8,
      deltaY: -40,
    }),
    false,
  );
}

function testWheelChainsAtFirstAndLast() {
  assert.equal(
    shouldReleaseWheelToPage({
      pageScrollY: 0,
      activeIndex: 0,
      lastIndex: 8,
      deltaY: -40,
    }),
    true,
  );
  assert.equal(
    shouldReleaseWheelToPage({
      pageScrollY: 0,
      activeIndex: 0,
      lastIndex: 8,
      deltaY: 40,
    }),
    false,
  );
  assert.equal(
    shouldReleaseWheelToPage({
      pageScrollY: 0,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: 40,
    }),
    true,
  );
  assert.equal(
    shouldReleaseWheelToPage({
      pageScrollY: 0,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: -40,
    }),
    false,
  );
}

function testWheelYieldsWhenPageHasScrolled() {
  assert.equal(
    shouldReleaseWheelToPage({
      pageScrollY: 80,
      activeIndex: 3,
      lastIndex: 8,
      deltaY: -40,
    }),
    true,
  );
  assert.equal(
    shouldReleaseWheelToPage({
      pageScrollY: 80,
      activeIndex: 8,
      lastIndex: 8,
      deltaY: 40,
    }),
    true,
  );
}

function testKeysMatchWheelAtBoundaries() {
  assert.equal(
    shouldReleaseKeyToPage({
      pageScrollY: 0,
      activeIndex: 8,
      lastIndex: 8,
      key: 'ArrowDown',
    }),
    true,
  );
  assert.equal(
    shouldReleaseKeyToPage({
      pageScrollY: 0,
      activeIndex: 8,
      lastIndex: 8,
      key: 'PageDown',
    }),
    true,
  );
  assert.equal(
    shouldReleaseKeyToPage({
      pageScrollY: 0,
      activeIndex: 0,
      lastIndex: 8,
      key: 'ArrowUp',
    }),
    true,
  );
  assert.equal(
    shouldReleaseKeyToPage({
      pageScrollY: 0,
      activeIndex: 8,
      lastIndex: 8,
      key: 'End',
    }),
    true,
  );
  assert.equal(
    shouldReleaseKeyToPage({
      pageScrollY: 0,
      activeIndex: 0,
      lastIndex: 8,
      key: 'Home',
    }),
    true,
  );
  assert.equal(
    shouldReleaseKeyToPage({
      pageScrollY: 0,
      activeIndex: 3,
      lastIndex: 8,
      key: 'ArrowDown',
    }),
    false,
  );
  assert.equal(
    shouldReleaseKeyToPage({
      pageScrollY: 40,
      activeIndex: 3,
      lastIndex: 8,
      key: 'ArrowDown',
    }),
    true,
  );
}

testWheelPagesInsideCarousel();
testWheelChainsAtFirstAndLast();
testWheelYieldsWhenPageHasScrolled();
testKeysMatchWheelAtBoundaries();

console.log('scroll-chain.test.ts: ok');
