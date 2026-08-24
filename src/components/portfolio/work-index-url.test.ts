/**
 *   npx tsx src/components/portfolio/work-index-url.test.ts
 */

import assert from 'node:assert/strict';
import {
  WORK_INDEX_ITEM_PARAM,
  filterPortfolioIndexSlides,
  readWorkIndexItem,
  resolveWorkIndexStartIndex,
  workIndexItemQuery,
  type WorkIndexFilterSlide,
} from './work-index-url';

const EMPTY_FILTERS = {format: '', industry: '', market: ''};

function slide(
  hrefSlug: string,
  extras: Partial<WorkIndexFilterSlide> & {id?: string} = {},
): WorkIndexFilterSlide & {id: string} {
  return {
    id: extras.id ?? hrefSlug,
    hrefSlug,
    videoFormatSlugs: extras.videoFormatSlugs ?? [],
    industrySlugs: extras.industrySlugs ?? [],
    marketSlugs: extras.marketSlugs ?? [],
    isAppendedFeatured: extras.isAppendedFeatured,
  };
}

function testReadWorkIndexItem() {
  assert.equal(readWorkIndexItem(new URLSearchParams('')), '');
  assert.equal(
    readWorkIndexItem(new URLSearchParams(`${WORK_INDEX_ITEM_PARAM}=campaign-one`)),
    'campaign-one',
  );
  assert.equal(
    readWorkIndexItem(new URLSearchParams(`${WORK_INDEX_ITEM_PARAM}=%20`)),
    '',
  );
}

function testItemQueryOmitsFirstSnap() {
  assert.deepEqual(workIndexItemQuery('campaign-one', 0), {});
  assert.deepEqual(workIndexItemQuery('campaign-one', 4), {
    [WORK_INDEX_ITEM_PARAM]: 'campaign-one',
  });
  assert.deepEqual(workIndexItemQuery(undefined, 4), {});
}

function testStartIndexFromSlug() {
  const slides = [slide('a'), slide('b'), slide('c')];
  assert.equal(resolveWorkIndexStartIndex(slides, EMPTY_FILTERS, ''), 0);
  assert.equal(resolveWorkIndexStartIndex(slides, EMPTY_FILTERS, 'b'), 1);
  assert.equal(resolveWorkIndexStartIndex(slides, EMPTY_FILTERS, 'missing'), 0);
}

function testStartIndexHonorsFiltersAndPrefersLibraryCopy() {
  const slides = [
    slide('a', {videoFormatSlugs: ['tv']}),
    slide('b', {videoFormatSlugs: ['web']}),
    slide('c', {videoFormatSlugs: ['tv']}),
    slide('c', {
      id: 'c-featured',
      isAppendedFeatured: true,
      videoFormatSlugs: ['tv'],
    }),
  ];
  const tv = {format: 'tv', industry: '', market: ''};
  const filtered = filterPortfolioIndexSlides(slides, tv);
  assert.deepEqual(
    filtered.map((entry) => entry.id),
    ['a', 'c'],
  );
  assert.equal(resolveWorkIndexStartIndex(slides, tv, 'c'), 1);
  assert.equal(resolveWorkIndexStartIndex(slides, tv, 'b'), 0);
}

testReadWorkIndexItem();
testItemQueryOmitsFirstSnap();
testStartIndexFromSlug();
testStartIndexHonorsFiltersAndPrefersLibraryCopy();

console.log('work-index-url.test.ts: ok');
