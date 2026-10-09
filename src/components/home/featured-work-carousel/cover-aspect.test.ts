import assert from 'node:assert/strict';
import test from 'node:test';
import {resolveCoverAspect} from './CarouselNativeVideo';

test('resolveCoverAspect keeps coded ultrawide when no content hint', () => {
  assert.equal(resolveCoverAspect(2.35, null), 2.35);
});

test('resolveCoverAspect tightens coded 16:9 when pillarbox hint is narrower', () => {
  assert.equal(resolveCoverAspect(16 / 9, 1.46), 1.46);
});

test('resolveCoverAspect does not widen past coded when hint is wider', () => {
  assert.equal(resolveCoverAspect(16 / 9, 2.0), 16 / 9);
});

test('resolveCoverAspect keeps frame-scan hint under coded 16:9', () => {
  // Ready-event re-apply must keep a ~1.46 frame hint, not snap back to 16:9.
  assert.equal(resolveCoverAspect(16 / 9, 1.459259259259259), 1.459259259259259);
});
