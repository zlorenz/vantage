/**
 *   npx tsx src/components/prototype/carousel/transition.test.ts
 */

import assert from 'node:assert/strict';
import {
  OUTGOING_SPEED_FACTOR,
  getScrollTransitionState,
  getTransitionStyles,
} from './transition';

function testRestHasIdentityStyles() {
  const down = getTransitionStyles(0, 1);
  assert.equal(down.outgoing.opacity, 1);
  assert.equal(down.outgoing.transform, 'translateY(0%)');
  assert.equal(down.incoming.opacity, 1);
  assert.equal(down.incoming.transform, 'translateY(0%)');

  const up = getTransitionStyles(0, -1);
  assert.equal(up.outgoing.opacity, 1);
  assert.equal(up.outgoing.transform, 'translateY(0%)');
}

function testCompleteFadesOutgoingAndParksIncoming() {
  const down = getTransitionStyles(1, 1);
  assert.equal(down.outgoing.opacity, 0);
  assert.equal(down.outgoing.transform, `translateY(${(1 - OUTGOING_SPEED_FACTOR) * 100}%)`);
  assert.equal(down.incoming.opacity, 1);
  assert.equal(down.incoming.transform, 'translateY(0%)');

  const up = getTransitionStyles(1, -1);
  assert.equal(up.outgoing.opacity, 0);
  assert.equal(up.outgoing.transform, `translateY(${-(1 - OUTGOING_SPEED_FACTOR) * 100}%)`);
  assert.equal(up.incoming.opacity, 1);
}

function testMidpointIsSymmetricByDirection() {
  const down = getTransitionStyles(0.5, 1);
  const up = getTransitionStyles(0.5, -1);
  assert.equal(down.outgoing.opacity, 0.5);
  assert.equal(up.outgoing.opacity, 0.5);
  assert.equal(down.incoming.opacity, 1);
  assert.equal(up.incoming.opacity, 1);

  const expectedPct = 0.5 * (1 - OUTGOING_SPEED_FACTOR) * 100;
  assert.equal(down.outgoing.transform, `translateY(${expectedPct}%)`);
  assert.equal(up.outgoing.transform, `translateY(${-expectedPct}%)`);
}

function testProgressIsClamped() {
  const under = getTransitionStyles(-0.2, 1);
  const over = getTransitionStyles(1.4, 1);
  assert.equal(under.outgoing.opacity, 1);
  assert.equal(under.outgoing.transform, 'translateY(0%)');
  assert.equal(over.outgoing.opacity, 0);
  assert.equal(over.incoming.transform, 'translateY(0%)');
}

function testScrollStateSettledAtSnapPoints() {
  const rest = getScrollTransitionState(0, 800, 0, 4);
  assert.equal(rest.settled, true);
  if (rest.settled) assert.equal(rest.index, 0);

  const next = getScrollTransitionState(800, 800, 0, 4);
  assert.equal(next.settled, true);
  if (next.settled) assert.equal(next.index, 1);
}

function testScrollStateDownFromSettled() {
  const state = getScrollTransitionState(400, 800, 0, 4);
  assert.equal(state.settled, false);
  if (state.settled) return;
  assert.equal(state.direction, 1);
  assert.equal(state.progress, 0.5);
  assert.equal(state.outgoingIndex, 0);
  assert.equal(state.incomingIndex, 1);
}

function testScrollStateUpFromSettled() {
  const state = getScrollTransitionState(400, 800, 1, 4);
  assert.equal(state.settled, false);
  if (state.settled) return;
  assert.equal(state.direction, -1);
  assert.equal(state.progress, 0.5);
  assert.equal(state.outgoingIndex, 1);
  assert.equal(state.incomingIndex, 0);
}

const tests = [
  testRestHasIdentityStyles,
  testCompleteFadesOutgoingAndParksIncoming,
  testMidpointIsSymmetricByDirection,
  testProgressIsClamped,
  testScrollStateSettledAtSnapPoints,
  testScrollStateDownFromSettled,
  testScrollStateUpFromSettled,
];

for (const test of tests) {
  test();
  console.log(`ok ${test.name}`);
}

console.log(`\n${tests.length} passed`);
