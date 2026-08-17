/**
 *   npx tsx src/components/prototype/carousel/overlay-motion.test.ts
 */

import assert from 'node:assert/strict';
import {
  OVERLAY_DEPTH_MAX_PX,
  overlayDepthOffsetPx,
  snapIndexFromScroll,
} from './overlay-motion';

const HEIGHT = 800;
const LAST = 4;

function testOffsetIsZeroAtEverySnap() {
  for (let i = 0; i <= LAST; i++) {
    assert.equal(overlayDepthOffsetPx(i * HEIGHT, i, HEIGHT), 0);
  }
}

function testOffsetClampsAtHalfSlide() {
  const half = HEIGHT / 2;
  assert.equal(overlayDepthOffsetPx(half, 0, HEIGHT), OVERLAY_DEPTH_MAX_PX);
  assert.equal(overlayDepthOffsetPx(-half, 0, HEIGHT), -OVERLAY_DEPTH_MAX_PX);
  assert.equal(overlayDepthOffsetPx(HEIGHT * 0.9, 0, HEIGHT), OVERLAY_DEPTH_MAX_PX);
  assert.equal(overlayDepthOffsetPx(HEIGHT + half, 1, HEIGHT), OVERLAY_DEPTH_MAX_PX);
}

function testOffsetScalesLinearlyBeforeClamp() {
  const quarter = HEIGHT / 4;
  assert.equal(overlayDepthOffsetPx(quarter, 0, HEIGHT), OVERLAY_DEPTH_MAX_PX / 2);
  assert.equal(overlayDepthOffsetPx(-quarter, 0, HEIGHT), -OVERLAY_DEPTH_MAX_PX / 2);
}

function testSnapBackPathReturnsToZero() {
  const path = [0, 80, 160, 240, 160, 80, 0];
  const last = overlayDepthOffsetPx(path[path.length - 1], 0, HEIGHT);
  assert.equal(last, 0);
  for (const top of path) {
    const offset = overlayDepthOffsetPx(top, 0, HEIGHT);
    assert.ok(Math.abs(offset) <= OVERLAY_DEPTH_MAX_PX);
  }
}

function testCommittedAdvanceLandsAtZeroOnTarget() {
  assert.equal(overlayDepthOffsetPx(HEIGHT, 1, HEIGHT), 0);
}

function testSnapIndexAtRestAndMidpoints() {
  assert.equal(snapIndexFromScroll(0, HEIGHT, LAST), 0);
  assert.equal(snapIndexFromScroll(HEIGHT, HEIGHT, LAST), 1);
  assert.equal(snapIndexFromScroll(HEIGHT * 0.4, HEIGHT, LAST), 0);
  assert.equal(snapIndexFromScroll(HEIGHT * 0.6, HEIGHT, LAST), 1);
  assert.equal(snapIndexFromScroll(HEIGHT * LAST + 40, HEIGHT, LAST), LAST);
}

const tests = [
  testOffsetIsZeroAtEverySnap,
  testOffsetClampsAtHalfSlide,
  testOffsetScalesLinearlyBeforeClamp,
  testSnapBackPathReturnsToZero,
  testCommittedAdvanceLandsAtZeroOnTarget,
  testSnapIndexAtRestAndMidpoints,
];

for (const test of tests) {
  test();
  console.log(`ok ${test.name}`);
}

console.log(`\n${tests.length} passed`);
