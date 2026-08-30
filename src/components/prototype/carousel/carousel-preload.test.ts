import assert from 'node:assert/strict';
import test from 'node:test';
import {carouselVideoPreload, shouldKickInactiveHlsBuffer} from './carousel-preload';

test('carouselVideoPreload: active slide is always auto', () => {
  assert.equal(carouselVideoPreload(true, true), 'auto');
  assert.equal(carouselVideoPreload(true, false), 'auto');
});

test('carouselVideoPreload: inactive desktop stays auto', () => {
  assert.equal(carouselVideoPreload(false, true), 'auto');
});

test('carouselVideoPreload: inactive mobile uses metadata', () => {
  assert.equal(carouselVideoPreload(false, false), 'metadata');
});

test('shouldKickInactiveHlsBuffer: desktop only', () => {
  assert.equal(shouldKickInactiveHlsBuffer(true), true);
  assert.equal(shouldKickInactiveHlsBuffer(false), false);
});
