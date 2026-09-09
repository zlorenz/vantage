/**
 * Dual-read helpers for portfolioEntry.videos[] vs legacy main + additionalVideos.
 */

import assert from 'node:assert/strict'
import {
  resolveCarouselPreviewPlayback,
  resolveMainFilmTitle,
  resolveMainPortfolioVideo,
  resolvePortfolioVideos,
} from './index'

const legacy = {
  vimeoUrl: 'https://vimeo.com/1',
  heroFilmTitle: 'Hero',
  previewCleanVimeoUrl: 'https://vimeo.com/clean',
  previewStartSeconds: 1,
  previewEndSeconds: 5,
  additionalVideos: [
    {vimeoUrl: 'https://vimeo.com/2', videoTitle: 'Extra'},
  ],
}

const fromLegacy = resolvePortfolioVideos(legacy)
assert.equal(fromLegacy.length, 2)
assert.equal(fromLegacy[0]?.videoTitle, 'Hero')
assert.equal(fromLegacy[1]?.videoTitle, 'Extra')
assert.equal(resolveMainPortfolioVideo(legacy)?.vimeoUrl, 'https://vimeo.com/1')
assert.equal(resolveMainFilmTitle(legacy).videoTitle, 'Hero')
assert.deepEqual(resolveCarouselPreviewPlayback(legacy), {
  vimeoUrl: 'https://vimeo.com/clean',
  previewStartSeconds: 1,
  previewEndSeconds: 5,
})

const unified = {
  videos: [
    {
      vimeoUrl: 'https://vimeo.com/10',
      videoTitle: 'Main',
      previewCleanVimeoUrl: 'https://vimeo.com/10-clean',
      previewStartSeconds: 2,
    },
    {vimeoUrl: 'https://vimeo.com/11', videoTitle: 'B'},
  ],
  // Stale legacy should be ignored when videos is present.
  vimeoUrl: 'https://vimeo.com/stale',
  heroFilmTitle: 'Stale',
}

const fromUnified = resolvePortfolioVideos(unified)
assert.equal(fromUnified.length, 2)
assert.equal(fromUnified[0]?.videoTitle, 'Main')
assert.equal(resolveMainFilmTitle(unified).videoTitle, 'Main')
assert.equal(
  resolveCarouselPreviewPlayback(unified).vimeoUrl,
  'https://vimeo.com/10-clean',
)

console.log('portfolio-videos resolve: ok')
