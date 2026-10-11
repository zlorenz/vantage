/**
 * Portfolio video resolve helpers — unified videos[] only.
 */

import assert from 'node:assert/strict'
import {
  resolveCarouselPreviewPlayback,
  resolveMainFilmTitle,
  resolveMainPortfolioVideo,
  resolvePortfolioVideoPosterSource,
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

const featured = {asset: {_ref: 'image-featured'}}
const override = {asset: {_ref: 'image-override'}}

assert.equal(
  resolvePortfolioVideoPosterSource({
    featuredImage: featured,
    isMainFilm: true,
  }),
  featured,
)
assert.equal(
  resolvePortfolioVideoPosterSource({
    thumbnail: override,
    featuredImage: featured,
    isMainFilm: true,
  }),
  override,
)
assert.equal(
  resolvePortfolioVideoPosterSource({
    featuredImage: featured,
    isMainFilm: false,
  }),
  undefined,
)
assert.equal(
  resolvePortfolioVideoPosterSource({
    thumbnail: override,
    featuredImage: featured,
    isMainFilm: false,
  }),
  override,
)

console.log('portfolio-videos resolve: ok')
