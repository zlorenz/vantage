import assert from 'node:assert/strict';
import test from 'node:test';
import {carouselVideoPreload} from './carousel-preload';

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
