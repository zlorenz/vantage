/**
 * Unit checks for About preview playback (custom URL vs portfolio clip).
 * Run: npx tsx src/lib/about-media.test.ts
 */

import assert from 'node:assert/strict'
import {resolveAboutPreviewPlayback} from './about-preview-playback'

const empty = {
  previewVimeoUrl: null,
  previewStartSeconds: null,
  previewEndSeconds: null,
}

assert.deepEqual(resolveAboutPreviewPlayback(null), empty)
assert.deepEqual(
  resolveAboutPreviewPlayback({mediaMode: 'staticImage'}),
  empty,
)

assert.deepEqual(
  resolveAboutPreviewPlayback({
    mediaMode: 'customVideo',
    videoUrl: 'https://vimeo.com/123456789',
  }),
  {
    previewVimeoUrl: 'https://vimeo.com/123456789',
    previewStartSeconds: null,
    previewEndSeconds: null,
  },
)

assert.deepEqual(
  resolveAboutPreviewPlayback({
    mediaMode: 'customVideo',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9wgGcQ',
  }),
  {
    previewVimeoUrl: 'https://www.youtube.com/watch?v=dQw4w9wgGcQ',
    previewStartSeconds: null,
    previewEndSeconds: null,
  },
)

assert.deepEqual(
  resolveAboutPreviewPlayback({
    mediaMode: 'customVideo',
    videoUrl: 'https://example.com/not-a-video',
  }),
  empty,
)

assert.deepEqual(
  resolveAboutPreviewPlayback({
    mediaMode: 'portfolioPreview',
    portfolioEntry: {
      videos: [
        {
          vimeoUrl: 'https://vimeo.com/111',
          previewCleanVimeoUrl: 'https://vimeo.com/222',
          previewStartSeconds: 3,
          previewEndSeconds: 9,
        },
      ],
    },
  }),
  {
    previewVimeoUrl: 'https://vimeo.com/222',
    previewStartSeconds: 3,
    previewEndSeconds: 9,
  },
)

console.log('about-media.test.ts: ok')
