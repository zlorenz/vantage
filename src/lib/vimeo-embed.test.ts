/**
 *   npx tsx src/lib/vimeo-embed.test.ts
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {vimeoPlayerEmbedSrc} from './vimeo';

test('vimeoPlayerEmbedSrc minimalUi hides metadata chrome', () => {
  const src = vimeoPlayerEmbedSrc('123456789', {minimalUi: true});
  assert.ok(src);
  assert.match(src!, /title=0/);
  assert.match(src!, /byline=0/);
  assert.match(src!, /portrait=0/);
  assert.match(src!, /badge=0/);
  assert.match(src!, /vimeo_logo=0/);
});

test('vimeoPlayerEmbedSrc minimalUi on unlisted URL includes privacy hash', () => {
  const src = vimeoPlayerEmbedSrc('https://vimeo.com/123456789/abc123hash', {
    minimalUi: true,
  });
  assert.ok(src);
  assert.match(src!, /h=abc123hash/);
  assert.match(src!, /title=0/);
});
