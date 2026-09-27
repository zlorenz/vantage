/**
 * Translation status for Studio content tables.
 *   npx tsx sanity/tools/content/translation-status.test.ts
 */

import assert from 'node:assert/strict'

import {
  portableTextHasText,
  translationSortRank,
  translationStatus,
} from './translation-status'

function labels(doc: Record<string, unknown>): string[] {
  return translationStatus(doc)?.missing.map((gap) => gap.label) ?? []
}

function testBlogGreenWhenCriticalAndSecondaryAreFilled() {
  const status = translationStatus({
    _type: 'blogPost',
    title: 'Talking dog',
    titleZh: '会说话的狗',
    excerpt: 'A story',
    excerptZh: '一个故事',
    bodyHasText: true,
    bodyZhHasText: true,
    slug: 'talking-dog',
    slugZh: '会说话的狗',
    metaDescription: 'Meta',
    metaDescriptionZh: '元描述',
  })
  assert.equal(status?.level, 'green')
  assert.deepEqual(status?.missing, [])
}

function testBlogRedWhenBodyMissing() {
  const status = translationStatus({
    _type: 'blogPost',
    title: 'Talking dog',
    titleZh: '会说话的狗',
    excerpt: 'A story',
    excerptZh: '一个故事',
    bodyHasText: true,
    bodyZhHasText: false,
  })
  assert.equal(status?.level, 'red')
  assert.deepEqual(labels({
    _type: 'blogPost',
    title: 'Talking dog',
    titleZh: '会说话的狗',
    excerpt: 'A story',
    excerptZh: '一个故事',
    bodyHasText: true,
    bodyZhHasText: false,
  }), ['Body'])
}

function testBlogYellowWhenOnlySlugMissing() {
  const status = translationStatus({
    _type: 'blogPost',
    title: 'Talking dog',
    titleZh: '会说话的狗',
    excerpt: 'A story',
    excerptZh: '一个故事',
    bodyHasText: true,
    bodyZhHasText: true,
    slug: 'talking-dog',
  })
  assert.equal(status?.level, 'yellow')
  assert.deepEqual(status?.missing.map((gap) => gap.label), ['Slug'])
}

function testEmptyEnglishExcerptDoesNotDemandChinese() {
  const status = translationStatus({
    _type: 'blogPost',
    title: 'Talking dog',
    titleZh: '会说话的狗',
    excerpt: '   ',
    bodyHasText: false,
  })
  assert.equal(status?.level, 'green')
  assert.deepEqual(status?.missing, [])
}

function testWhitespaceEnglishTitleIsNotApplicable() {
  assert.equal(
    translationStatus({
      _type: 'blogPost',
      title: '  ',
      excerpt: '',
      bodyHasText: false,
    }),
    null,
  )
}

function testBodyPresenceBothSidesCountsAsTranslated() {
  const status = translationStatus({
    _type: 'blogPost',
    title: 'Talking dog',
    titleZh: '会说话的狗',
    bodyHasText: true,
    bodyZhHasText: true,
  })
  assert.equal(status?.level, 'green')
}

function testPortfolioPartialTitleIsRed() {
  const status = translationStatus({
    _type: 'portfolioEntry',
    displayTitleParts: {
      brandName: 'Govee',
      brandNameZh: 'Govee',
      productName: 'Beni',
      campaignTitle: 'Robot',
      campaignTitleZh: '机器人',
    },
  })
  assert.equal(status?.level, 'red')
  assert.deepEqual(status?.missing.map((gap) => gap.label), ['Product name'])
}

function testPortfolioEmptyProductIsSkipped() {
  const status = translationStatus({
    _type: 'portfolioEntry',
    displayTitleParts: {
      brandName: 'Govee',
      brandNameZh: 'Govee',
      productName: '',
      campaignTitle: 'Robot',
      campaignTitleZh: '机器人',
    },
  })
  assert.equal(status?.level, 'green')
}

function testPortfolioOverrideOnlyWhenEnglishIsSet() {
  const missing = translationStatus({
    _type: 'portfolioEntry',
    displayTitleParts: {brandName: 'Govee', brandNameZh: 'Govee'},
    thumbTitleOverride: '<span>Custom</span>',
  })
  assert.equal(missing?.level, 'red')
  assert.deepEqual(missing?.missing.map((gap) => gap.label), ['Thumbnail title'])

  const skipped = translationStatus({
    _type: 'portfolioEntry',
    displayTitleParts: {brandName: 'Govee', brandNameZh: 'Govee'},
    thumbTitleOverride: '  ',
  })
  assert.equal(skipped?.level, 'green')
}

function testPortfolioDescriptionIsSecondary() {
  const status = translationStatus({
    _type: 'portfolioEntry',
    displayTitleParts: {brandName: 'Govee', brandNameZh: 'Govee'},
    description: 'Beside the player',
    videos: [{description: 'Episode notes', descriptionZh: ''}],
  })
  assert.equal(status?.level, 'yellow')
  assert.deepEqual(status?.missing.map((gap) => gap.label), [
    'Video 1 description',
    'Description',
  ])
}

function testPortfolioVideosIgnoreLegacyFields() {
  const status = translationStatus({
    _type: 'portfolioEntry',
    displayTitleParts: {brandName: 'Govee', brandNameZh: 'Govee'},
    videos: [{videoTitle: 'Episode', videoTitleZh: '一集'}],
    heroFilmTitle: 'Legacy',
    additionalVideos: [{videoTitle: 'Old film', description: 'Old notes'}],
  })
  assert.equal(status?.level, 'green')
}

function testPortfolioLegacyVideosWhenVideosArrayEmpty() {
  const status = translationStatus({
    _type: 'portfolioEntry',
    displayTitleParts: {brandName: 'Govee', brandNameZh: 'Govee'},
    videos: [],
    heroFilmTitle: 'Legacy episode',
    additionalVideos: [{videoTitle: 'Old film'}],
  })
  assert.equal(status?.level, 'red')
  assert.deepEqual(status?.missing.map((gap) => gap.label), [
    'Hero film title',
    'Video 1 title',
  ])
}

function testPageFounderAndAwardTiers() {
  const red = translationStatus({
    _type: 'page',
    title: 'About',
    titleZh: '关于',
    founders: [
      {
        name: 'Ada',
        jobTitle: 'Director',
        professionalTitle: 'Film Director',
      },
    ],
  })
  assert.equal(red?.level, 'red')
  assert.deepEqual(red?.missing.map((gap) => gap.label), [
    'Job title (Ada)',
    'Professional title (Ada)',
  ])

  const yellow = translationStatus({
    _type: 'page',
    title: 'About',
    titleZh: '关于',
    founders: [
      {
        name: 'Ada',
        jobTitle: 'Director',
        jobTitleZh: '导演',
        professionalTitle: 'Film Director',
        bio: 'Makes films',
      },
    ],
  })
  assert.equal(yellow?.level, 'yellow')
  assert.deepEqual(yellow?.missing.map((gap) => gap.label), [
    'Professional title (Ada)',
    'Bio (Ada)',
  ])

  const award = translationStatus({
    _type: 'page',
    title: 'Awards',
    titleZh: '奖项',
    awardItems: [{title: 'Cannes', category: 'Film'}],
  })
  assert.equal(award?.level, 'red')
  assert.deepEqual(award?.missing.map((gap) => gap.label), [
    'Award title (Cannes)',
    'Award category (Cannes)',
  ])
}

function testTaxonomyDescriptionIsCriticalAndSlugIsSecondary() {
  const red = translationStatus({
    _type: 'industry',
    title: 'Tech',
    titleZh: '科技',
    description: 'Archive intro',
  })
  assert.equal(red?.level, 'red')
  assert.deepEqual(red?.missing.map((gap) => gap.label), ['Description'])

  const yellow = translationStatus({
    _type: 'category',
    title: 'News',
    titleZh: '新闻',
    description: 'Ignored on categories',
    slug: 'news',
  })
  assert.equal(yellow?.level, 'yellow')
  assert.deepEqual(yellow?.missing.map((gap) => gap.label), ['Slug'])
}

function testSiteSettingsCtaCriticalAndContactSecondary() {
  const red = translationStatus({
    _type: 'siteSettings',
    campaignCta: {
      heading: 'Start a brief',
      headingZh: '开始简报',
      paragraphs: ['First', 'Second'],
      paragraphsZh: ['第一'],
      buttonLabel: 'Go',
      buttonLabelZh: '前往',
    },
  })
  assert.equal(red?.level, 'red')
  assert.deepEqual(red?.missing.map((gap) => gap.label), ['CTA paragraphs'])

  const yellow = translationStatus({
    _type: 'siteSettings',
    campaignCta: {
      heading: 'Start a brief',
      headingZh: '开始简报',
      paragraphs: ['First', ''],
      paragraphsZh: ['第一'],
      buttonLabel: 'Go',
      buttonLabelZh: '前往',
    },
    contactModalTitle: 'Contact',
    contactModalHasText: true,
    contactModalZhHasText: false,
  })
  assert.equal(yellow?.level, 'yellow')
  assert.deepEqual(yellow?.missing.map((gap) => gap.label), [
    'Contact modal title',
    'Contact modal body',
  ])
}

function testCrewAndPlatformAreOmitted() {
  assert.equal(translationStatus({_type: 'creditIdentity', name: 'Ada', nameZh: ''}), null)
  assert.equal(translationStatus({_type: 'platform', title: 'Vimeo'}), null)
}

function testSortRankIsRedThenYellowThenGreen() {
  assert.deepEqual(
    ['green', 'red', 'yellow', null].map((level) =>
      translationSortRank(level as 'green' | 'yellow' | 'red' | null),
    ),
    [2, 0, 1, 3],
  )
}

function testPortableTextExpressionCoversBlocksAndPullQuotes() {
  const expr = portableTextHasText('body')
  assert.match(expr, /pt::text\(body\)/)
  assert.match(expr, /pullQuote/)
  assert.match(expr, /ctaButton/)
}

const tests = [
  testBlogGreenWhenCriticalAndSecondaryAreFilled,
  testBlogRedWhenBodyMissing,
  testBlogYellowWhenOnlySlugMissing,
  testEmptyEnglishExcerptDoesNotDemandChinese,
  testWhitespaceEnglishTitleIsNotApplicable,
  testBodyPresenceBothSidesCountsAsTranslated,
  testPortfolioPartialTitleIsRed,
  testPortfolioEmptyProductIsSkipped,
  testPortfolioOverrideOnlyWhenEnglishIsSet,
  testPortfolioDescriptionIsSecondary,
  testPortfolioVideosIgnoreLegacyFields,
  testPortfolioLegacyVideosWhenVideosArrayEmpty,
  testPageFounderAndAwardTiers,
  testTaxonomyDescriptionIsCriticalAndSlugIsSecondary,
  testSiteSettingsCtaCriticalAndContactSecondary,
  testCrewAndPlatformAreOmitted,
  testSortRankIsRedThenYellowThenGreen,
  testPortableTextExpressionCoversBlocksAndPullQuotes,
]

for (const test of tests) {
  test()
  console.log(`ok ${test.name}`)
}

console.log(`\n${tests.length} passed`)
