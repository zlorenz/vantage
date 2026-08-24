/**
 *   npx tsx src/components/portfolio/work-index-url.test.ts
 */

import assert from 'node:assert/strict';
import {
  WORK_INDEX_ITEM_PARAM,
  WORK_INDEX_SEARCH_PARAM,
  filterPortfolioIndexSlides,
  readWorkIndexItem,
  readWorkIndexSearch,
  resolveWorkIndexStartIndex,
  workIndexItemQuery,
  workIndexSearchQuery,
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
    searchHaystack: extras.searchHaystack,
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

function testReadWorkIndexSearch() {
  assert.equal(readWorkIndexSearch(new URLSearchParams('')), '');
  assert.equal(
    readWorkIndexSearch(new URLSearchParams(`${WORK_INDEX_SEARCH_PARAM}=Toyota`)),
    'Toyota',
  );
  assert.equal(
    readWorkIndexSearch(new URLSearchParams(`${WORK_INDEX_SEARCH_PARAM}=%20`)),
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

function testSearchQueryOmitsEmpty() {
  assert.deepEqual(workIndexSearchQuery(''), {});
  assert.deepEqual(workIndexSearchQuery('  '), {});
  assert.deepEqual(workIndexSearchQuery(' Toyota '), {
    [WORK_INDEX_SEARCH_PARAM]: 'Toyota',
  });
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

function testSearchMatchesHaystackAndDropsFeatured() {
  const slides = [
    slide('toyota', {
      searchHaystack: 'toyota camry 2022 absolute charisma jane doe',
    }),
    slide('hyundai', {
      searchHaystack: 'hyundai ioniq5 progress for humanity',
    }),
    slide('toyota', {
      id: 'toyota-featured',
      isAppendedFeatured: true,
      searchHaystack: 'toyota camry 2022 absolute charisma jane doe',
    }),
  ];
  const filtered = filterPortfolioIndexSlides(slides, EMPTY_FILTERS, 'Jane');
  assert.deepEqual(
    filtered.map((entry) => entry.id),
    ['toyota'],
  );
  assert.equal(
    resolveWorkIndexStartIndex(slides, EMPTY_FILTERS, 'toyota', 'camry'),
    0,
  );
}

testReadWorkIndexItem();
testReadWorkIndexSearch();
testItemQueryOmitsFirstSnap();
testSearchQueryOmitsEmpty();
testStartIndexFromSlug();
testStartIndexHonorsFiltersAndPrefersLibraryCopy();
testSearchMatchesHaystackAndDropsFeatured();

console.log('work-index-url.test.ts: ok');
