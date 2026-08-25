/**
 *   npx tsx src/components/portfolio/nearest-snap-from-progress.test.ts
 */

import assert from 'node:assert/strict';
import {nearestSnapIndexFromProgress} from './nearest-snap-from-progress';

function testSingleSnap() {
  assert.equal(nearestSnapIndexFromProgress(0.5, [0], true), 0);
  assert.equal(nearestSnapIndexFromProgress(0.5, [], false), 0);
}

function testNonLoopLinear() {
  const snaps = [0, 0.5, 1];
  assert.equal(nearestSnapIndexFromProgress(0, snaps, false), 0);
  assert.equal(nearestSnapIndexFromProgress(0.4, snaps, false), 1);
  assert.equal(nearestSnapIndexFromProgress(0.9, snaps, false), 2);
  // progress=1 must stay on the last snap (not wrap to 0).
  assert.equal(nearestSnapIndexFromProgress(1, snaps, false), 2);
  assert.equal(nearestSnapIndexFromProgress(1.2, snaps, false), 2);
  assert.equal(nearestSnapIndexFromProgress(-0.1, snaps, false), 0);
}

function testLoopCircular() {
  const snaps = [0, 0.5];
  assert.equal(nearestSnapIndexFromProgress(0.05, snaps, true), 0);
  assert.equal(nearestSnapIndexFromProgress(0.45, snaps, true), 1);
  // Near wrap: progress 0.99 is closer to 0 than to 0.5 circularly.
  assert.equal(nearestSnapIndexFromProgress(0.99, snaps, true), 0);
  assert.equal(nearestSnapIndexFromProgress(1, snaps, true), 0);
}

testSingleSnap();
testNonLoopLinear();
testLoopCircular();

console.log('nearest-snap-from-progress.test.ts: ok');
