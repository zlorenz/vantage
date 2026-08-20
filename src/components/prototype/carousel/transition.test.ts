/**
 *   npx tsx src/components/prototype/carousel/transition.test.ts
 */

import assert from 'node:assert/strict';
import {
  OUTGOING_BLUR_EDGE_SCALE,
  OUTGOING_BLUR_MAX_PX,
  OUTGOING_OPACITY_MIN,
  OUTGOING_SPEED_FACTOR,
  OVERLAY_SPEED_FACTOR,
  getScrollTransitionState,
  getTransitionStyles,
} from './transition';

function testRestHasIdentityStyles() {
  const down = getTransitionStyles(0, 1);
  assert.equal(down.outgoing.opacity, 1);
  assert.equal(down.outgoing.filter, 'none');
  assert.equal(down.outgoing.stackTransform, 'none');
  assert.equal(down.outgoing.transform, 'translateY(0%)');
  assert.equal(down.outgoing.overlayTransform, 'translateY(0%)');
  assert.equal(down.incoming.opacity, OUTGOING_OPACITY_MIN);
  assert.equal(down.incoming.filter, `blur(${OUTGOING_BLUR_MAX_PX}px)`);
  assert.equal(down.incoming.stackTransform, `scale(${OUTGOING_BLUR_EDGE_SCALE})`);
  assert.equal(down.incoming.transform, 'translateY(0%)');
  assert.equal(
    down.incoming.overlayTransform,
    `translateY(${(OVERLAY_SPEED_FACTOR - 1) * 100}%)`,
  );

  const up = getTransitionStyles(0, -1);
  assert.equal(up.outgoing.opacity, 1);
  assert.equal(up.outgoing.filter, 'none');
  assert.equal(up.outgoing.stackTransform, 'none');
  assert.equal(up.outgoing.transform, 'translateY(0%)');
  assert.equal(up.outgoing.overlayTransform, 'translateY(0%)');
  assert.equal(up.incoming.opacity, OUTGOING_OPACITY_MIN);
  assert.equal(up.incoming.filter, `blur(${OUTGOING_BLUR_MAX_PX}px)`);
  assert.equal(up.incoming.stackTransform, `scale(${OUTGOING_BLUR_EDGE_SCALE})`);
}

function testCompleteFadesOutgoingAndParksIncoming() {
  const down = getTransitionStyles(1, 1);
  assert.equal(down.outgoing.opacity, OUTGOING_OPACITY_MIN);
  assert.equal(down.outgoing.filter, `blur(${OUTGOING_BLUR_MAX_PX}px)`);
  assert.equal(down.outgoing.stackTransform, `scale(${OUTGOING_BLUR_EDGE_SCALE})`);
  assert.equal(down.outgoing.transform, `translateY(${(1 - OUTGOING_SPEED_FACTOR) * 100}%)`);
  assert.equal(down.incoming.opacity, 1);
  assert.equal(down.incoming.filter, 'none');
  assert.equal(down.incoming.stackTransform, 'none');
  assert.equal(down.incoming.transform, 'translateY(0%)');
  assert.equal(down.incoming.overlayTransform, 'translateY(0%)');

  const up = getTransitionStyles(1, -1);
  assert.equal(up.outgoing.opacity, OUTGOING_OPACITY_MIN);
  assert.equal(up.outgoing.filter, `blur(${OUTGOING_BLUR_MAX_PX}px)`);
  assert.equal(up.outgoing.stackTransform, `scale(${OUTGOING_BLUR_EDGE_SCALE})`);
  assert.equal(up.outgoing.transform, `translateY(${-(1 - OUTGOING_SPEED_FACTOR) * 100}%)`);
  assert.equal(up.incoming.opacity, 1);
  assert.equal(up.incoming.filter, 'none');
  assert.equal(up.incoming.stackTransform, 'none');
  assert.equal(up.incoming.overlayTransform, 'translateY(0%)');
}

function testMidpointIsSymmetricByDirection() {
  const down = getTransitionStyles(0.5, 1);
  const up = getTransitionStyles(0.5, -1);
  const midOpacity = OUTGOING_OPACITY_MIN + (1 - OUTGOING_OPACITY_MIN) * 0.5;
  const midBlur = `blur(${0.5 * OUTGOING_BLUR_MAX_PX}px)`;
  const midScale = `scale(${1 + 0.5 * (OUTGOING_BLUR_EDGE_SCALE - 1)})`;
  assert.equal(down.outgoing.opacity, midOpacity);
  assert.equal(up.outgoing.opacity, midOpacity);
  assert.equal(down.outgoing.filter, midBlur);
  assert.equal(up.outgoing.filter, midBlur);
  assert.equal(down.outgoing.stackTransform, midScale);
  assert.equal(up.outgoing.stackTransform, midScale);
  assert.equal(down.incoming.opacity, midOpacity);
  assert.equal(up.incoming.opacity, midOpacity);
  assert.equal(down.incoming.filter, midBlur);
  assert.equal(up.incoming.filter, midBlur);
  assert.equal(down.incoming.stackTransform, midScale);
  assert.equal(up.incoming.stackTransform, midScale);

  const expectedPct = 0.5 * (1 - OUTGOING_SPEED_FACTOR) * 100;
  assert.equal(down.outgoing.transform, `translateY(${expectedPct}%)`);
  assert.equal(up.outgoing.transform, `translateY(${-expectedPct}%)`);

  const overlayLead = 0.5 * (OVERLAY_SPEED_FACTOR - 1) * 100;
  assert.equal(down.incoming.overlayTransform, `translateY(${overlayLead}%)`);
  assert.equal(down.outgoing.overlayTransform, `translateY(${-overlayLead}%)`);
  assert.equal(up.incoming.overlayTransform, `translateY(${-overlayLead}%)`);
  assert.equal(up.outgoing.overlayTransform, `translateY(${overlayLead}%)`);
}

function testProgressIsClamped() {
  const under = getTransitionStyles(-0.2, 1);
  const over = getTransitionStyles(1.4, 1);
  assert.equal(under.outgoing.opacity, 1);
  assert.equal(under.outgoing.filter, 'none');
  assert.equal(under.outgoing.stackTransform, 'none');
  assert.equal(under.outgoing.transform, 'translateY(0%)');
  assert.equal(under.incoming.opacity, OUTGOING_OPACITY_MIN);
  assert.equal(under.incoming.filter, `blur(${OUTGOING_BLUR_MAX_PX}px)`);
  assert.equal(under.incoming.stackTransform, `scale(${OUTGOING_BLUR_EDGE_SCALE})`);
  assert.equal(over.outgoing.opacity, OUTGOING_OPACITY_MIN);
  assert.equal(over.outgoing.filter, `blur(${OUTGOING_BLUR_MAX_PX}px)`);
  assert.equal(over.outgoing.stackTransform, `scale(${OUTGOING_BLUR_EDGE_SCALE})`);
  assert.equal(over.incoming.opacity, 1);
  assert.equal(over.incoming.filter, 'none');
  assert.equal(over.incoming.stackTransform, 'none');
  assert.equal(over.incoming.transform, 'translateY(0%)');
  assert.equal(over.incoming.overlayTransform, 'translateY(0%)');
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
