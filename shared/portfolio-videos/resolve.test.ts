/**
 * Portfolio video resolve helpers — unified videos[] only.
 */

import assert from 'node:assert/strict'
import {
  resolveCarouselPreviewPlayback,
  resolveMainFilmTitle,
  resolveMainPortfolioVideo,
  resolvePortfolioVideos,
} from './index'

assert.deepEqual(resolvePortfolioVideos({}), [])
assert.equal(resolveMainPortfolioVideo({videos: []}), null)

const unified = {
  videos: [
    {
      vimeoUrl: 'https://vimeo.com/10',
      videoTitle: 'Main',
      previewCleanVimeoUrl: 'https://vimeo.com/10-clean',
      previewStartSeconds: 2,
      previewEndSeconds: 8,
    },
    {vimeoUrl: 'https://vimeo.com/11', videoTitle: 'B'},
  ],
}

const fromUnified = resolvePortfolioVideos(unified)
assert.equal(fromUnified.length, 2)
assert.equal(fromUnified[0]?.videoTitle, 'Main')
assert.equal(resolveMainFilmTitle(unified).videoTitle, 'Main')
assert.deepEqual(resolveCarouselPreviewPlayback(unified), {
  vimeoUrl: 'https://vimeo.com/10-clean',
  previewStartSeconds: 2,
  previewEndSeconds: 8,
})

console.log('portfolio-videos resolve: ok')
