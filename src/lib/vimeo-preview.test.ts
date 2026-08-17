/**
 *   npx tsx src/lib/vimeo-preview.test.ts
 */

import assert from 'node:assert/strict';
import {
  pickProgressiveRendition,
  PREFERRED_CAROUSEL_HEIGHT,
  PREFERRED_KEYFRAME_HEIGHT,
} from './vimeo-preview';

function files(heights: number[]) {
  return heights.map((height) => ({
    rendition: `${height}p`,
    width: Math.round((height * 16) / 9),
    height,
    link: `https://player.vimeo.com/example/${height}`,
    link_expiration_time: '2026-08-17T10:00:00+00:00',
    type: 'video/mp4',
    codec: 'H264',
  }));
}

function testPrefers720WhenPresent() {
  const picked = pickProgressiveRendition(
    files([1080, 720, 540, 360, 240]),
    PREFERRED_KEYFRAME_HEIGHT,
  );
  assert.equal(picked?.rendition, '720p');
  assert.equal(picked?.height, 720);
  assert.ok(picked?.url.endsWith('/720'));
}

function testFallsBackToHighestWhen720Missing() {
  const picked = pickProgressiveRendition(files([1080, 540, 360]), PREFERRED_KEYFRAME_HEIGHT);
  assert.equal(picked?.rendition, '1080p');
  assert.equal(picked?.height, 1080);
}

function testFallsBackToHighestBelow720() {
  const picked = pickProgressiveRendition(files([540, 360, 240]), PREFERRED_KEYFRAME_HEIGHT);
  assert.equal(picked?.rendition, '540p');
}

function testKeyframeDefaultHeightIs720() {
  const picked = pickProgressiveRendition(files([1080, 720, 540, 360, 240]));
  assert.equal(picked?.rendition, '720p');
  assert.equal(picked?.height, 720);
}

function testPrefers720ForCarouselWhenPresent() {
  const picked = pickProgressiveRendition(
    files([1080, 720, 540, 360, 240]),
    PREFERRED_CAROUSEL_HEIGHT,
  );
  assert.equal(picked?.rendition, '720p');
  assert.equal(picked?.height, 720);
  assert.ok(picked?.url.endsWith('/720'));
}

function testCarouselFallsBackToHighestWhen720Missing() {
  const picked = pickProgressiveRendition(files([1080, 540, 360]), PREFERRED_CAROUSEL_HEIGHT);
  assert.equal(picked?.rendition, '1080p');
  assert.equal(picked?.height, 1080);
}

function testCarouselFallsBackToHighestBelow720() {
  const picked = pickProgressiveRendition(files([360, 240]), PREFERRED_CAROUSEL_HEIGHT);
  assert.equal(picked?.rendition, '360p');
}

function testEmptyOrUnlinkedReturnsNull() {
  assert.equal(pickProgressiveRendition([]), null);
  assert.equal(pickProgressiveRendition(null), null);
  assert.equal(
    pickProgressiveRendition([{rendition: '720p', height: 720, link: null}]),
    null,
  );
}

const tests = [
  testPrefers720WhenPresent,
  testFallsBackToHighestWhen720Missing,
  testFallsBackToHighestBelow720,
  testKeyframeDefaultHeightIs720,
  testPrefers720ForCarouselWhenPresent,
  testCarouselFallsBackToHighestWhen720Missing,
  testCarouselFallsBackToHighestBelow720,
  testEmptyOrUnlinkedReturnsNull,
];

for (const test of tests) {
  test();
  console.log(`ok ${test.name}`);
}

console.log(`\n${tests.length} passed`);
