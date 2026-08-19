/**
 * Unit checks for phrase-book helpers.
 *   npx tsx shared/phrase-book/phrase-book.test.ts
 */

import assert from 'node:assert/strict'

import {
  canonicalCrewRoleLabel,
  isCrewRolePluralAlias,
} from '../crew-credits'

import {
  buildPhraseMap,
  buildPhraseTableRows,
  categoryForCmsField,
  classifyPhraseUsage,
  collectCatalogCrewRoleHits,
  collectLiveEnHits,
  creditLabelSeedPairs,
  interfaceCodeRows,
  isCompanyCrewRole,
  liveEnSet,
  lookupPhrase,
  normalizePhraseKey,
  phraseContainsSpan,
  phraseDocumentId,
  preferCategory,
  resolveLocalizedString,
} from './index'

function testNormalize() {
  assert.equal(normalizePhraseKey('  DJI  '), 'DJI')
  assert.equal(normalizePhraseKey('A   B'), 'A B')
}

function testIdsStableAndCaseSensitive() {
  const a = phraseDocumentId('DJI')
  const b = phraseDocumentId('DJI')
  const c = phraseDocumentId('dji')
  assert.equal(a, b)
  assert.notEqual(a, c)
  assert.ok(a.startsWith('phrase.'))
}

function testLookupAndResolve() {
  const map = buildPhraseMap([
    {en: 'DJI', zh: '大疆'},
    {en: '  EcoFlow ', zh: ' 正浩 '},
  ])
  assert.equal(lookupPhrase(map, 'DJI'), '大疆')
  assert.equal(lookupPhrase(map, 'EcoFlow'), '正浩')
  assert.equal(lookupPhrase(map, 'Unknown'), undefined)

  assert.equal(
    resolveLocalizedString({locale: 'en', en: 'DJI', zh: '大疆', phrases: map}),
    'DJI',
  )
  assert.equal(
    resolveLocalizedString({locale: 'zh', en: 'DJI', zh: 'wrong', phrases: map}),
    '大疆',
  )
  assert.equal(
    resolveLocalizedString({
      locale: 'zh',
      en: 'Unique Campaign',
      zh: '独特活动',
      phrases: map,
    }),
    '独特活动',
  )
  assert.equal(
    resolveLocalizedString({locale: 'zh', en: 'Missing', phrases: map}),
    'Missing',
  )
}

function testClassifyUnused() {
  const live = liveEnSet([
    {en: 'DJI', source: 'a', category: 'companies'},
    {en: 'Govee Halloween', source: 'b', category: 'campaigns'},
  ])
  const report = classifyPhraseUsage(
    [
      {_id: 'phrase.dji', en: 'DJI', zh: '大疆'},
      {
        _id: 'phrase.legacy',
        en: '<span>DJI </span> My Hong Kong <span> Mountain Biking </span>',
        zh: '<span>大疆 </span> 我的香港',
      },
      {_id: 'phrase.orphan', en: 'Old Campaign Nobody Uses', zh: '旧活动'},
    ],
    live,
  )
  assert.equal(report.inUseCount, 1)
  assert.equal(report.unusedCount, 2)
  assert.equal(report.unusedWithSpanCount, 1)
  assert.ok(phraseContainsSpan(report.unused.find((u) => u.hasSpan)!.en))
}

function testCategories() {
  assert.equal(
    categoryForCmsField('portfolioEntry', 'displayTitleParts.brandName'),
    'companies',
  )
  assert.equal(
    categoryForCmsField('portfolioEntry', 'crewCredits[].people.name'),
    'companies',
  )
  assert.equal(
    categoryForCmsField('portfolioEntry', 'displayTitleParts.campaignTitle'),
    'campaigns',
  )
  assert.equal(categoryForCmsField('industry', 'title'), 'work-filters')
  assert.equal(categoryForCmsField('blogPost', 'title'), 'pages-news')
  assert.equal(categoryForCmsField('siteSettings', 'contactModalTitle'), 'interface')
  assert.equal(preferCategory('companies', 'campaigns'), 'companies')
  assert.equal(preferCategory('descriptions', 'crew-roles'), 'crew-roles')
  assert.equal(isCompanyCrewRole('brand', 'Brand'), true)
  assert.equal(isCompanyCrewRole('agency', 'Agency'), true)
  assert.equal(isCompanyCrewRole('production_company', null), true)
  assert.equal(isCompanyCrewRole('director', 'Director'), false)
}

function testInterfaceVsPagesNewsCodeRows() {
  const rows = interfaceCodeRows()
  const byPath = new Map(rows.map((r) => [r.codePath, r]))
  const heading = byPath.get('messages/*.json → Home.aboutHeading')
  assert.equal(heading?.category, 'pages-news')
  assert.equal(heading?.en, 'GLOBAL COMMERCIAL FILM PRODUCTION')
  assert.equal(
    byPath.get('messages/*.json → Home.workSection')?.category,
    'pages-news',
  )
  assert.equal(
    byPath.get('messages/*.json → About.team')?.category,
    'pages-news',
  )
  assert.equal(
    byPath.get('messages/*.json → Nav.home')?.category,
    'interface',
  )
  assert.equal(
    byPath.get('messages/*.json → Home.exploreButton')?.category,
    'interface',
  )
  assert.equal(
    byPath.get('messages/*.json → Filters.clear')?.category,
    'interface',
  )

  const brief = rows.filter((r) =>
    r.codePath.includes('campaign-brief-i18n.ts'),
  )
  assert.ok(brief.length > 40, `expected many brief rows, got ${brief.length}`)
  const projectTitle = brief.find((r) => r.en === 'Project title')
  assert.equal(projectTitle?.zh, '项目名称')
  assert.equal(projectTitle?.category, 'interface')
  const hear = brief.find((r) => r.en === 'How did you hear about us?')
  assert.equal(hear?.zh, '您是如何知道我们的？')
  const google = brief.find((r) => r.en === 'Google')
  assert.equal(google?.zh, '谷歌搜索')
  const required = brief.find((r) => r.en === 'This field is required.')
  assert.equal(required?.zh, '此字段为必填项。')
  assert.equal(
    rows.some((r) => r.en.includes('Campaign Brief form — see')),
    false,
    'stub placeholder removed',
  )
}

function testCollectCompanySources() {
  const hits = collectLiveEnHits([
    {
      _id: 'portfolio-1',
      _type: 'portfolioEntry',
      displayTitleParts: {brandName: 'Govee'},
      crewCredits: [
        {
          roleKey: 'brand',
          role: 'Brand',
          people: [{name: 'Govee'}],
        },
        {
          roleKey: 'agency',
          role: 'Agency',
          people: [{identityName: 'Identity Only Agency'}],
        },
        {
          roleKey: 'agency',
          role: 'Agency',
          people: [{name: 'MRM//McCann'}],
        },
        {
          roleKey: 'director',
          role: 'Director',
          people: [{name: 'Paul Moore'}],
        },
      ],
    },
  ])
  const companyEns = hits
    .filter((h) => h.category === 'companies')
    .map((h) => h.en)
    .sort()
  assert.ok(companyEns.includes('Govee'))
  assert.ok(companyEns.includes('Identity Only Agency'))
  assert.ok(companyEns.includes('MRM//McCann'))
  assert.ok(!companyEns.includes('Paul Moore'), 'human director names excluded')
}

function testCrewRolePluralCanonical() {
  assert.equal(canonicalCrewRoleLabel('1st ACs'), '1st AC')
  assert.equal(canonicalCrewRoleLabel('1st AC'), '1st AC')
  assert.equal(canonicalCrewRoleLabel('Agencies'), 'Agency')
  assert.equal(canonicalCrewRoleLabel('Translators'), 'Translator')
  assert.equal(
    canonicalCrewRoleLabel('Camera Assistants'),
    'Camera Assistants',
    'catalog invariant plural stays canonical',
  )
  assert.equal(isCrewRolePluralAlias('1st ACs'), true)
  assert.equal(isCrewRolePluralAlias('1st AC'), false)

  const catalogEns = collectCatalogCrewRoleHits().map((h) => h.en)
  assert.ok(catalogEns.includes('1st AC'))
  assert.ok(!catalogEns.includes('1st ACs'), 'catalog no longer emits plural')

  const seedEns = new Set(creditLabelSeedPairs().map((p) => p.en))
  assert.ok(seedEns.has('1st AC'))
  assert.ok(!seedEns.has('1st ACs'))
  assert.ok(seedEns.has('Production Service'))
  assert.ok(!seedEns.has('Production Services'))
  assert.ok(
    !seedEns.has('Graphic Design'),
    'freeform CREDIT_LABEL_ZH keys must not auto-seed',
  )
  assert.ok(!seedEns.has('Camera Assistant'))
  const prodService = creditLabelSeedPairs().find(
    (p) => p.en === 'Production Service',
  )
  assert.equal(prodService?.zh, '制片服务', 'prefer singular ZH on conflict')

  const hits = collectLiveEnHits([
    {
      _id: 'portfolio-2',
      _type: 'portfolioEntry',
      crewCredits: [
        {roleKey: '1st_ac', role: '1st ACs', people: [{name: 'A'}, {name: 'B'}]},
      ],
    },
  ])
  const roleHits = hits.filter((h) => h.category === 'crew-roles')
  assert.deepEqual(
    roleHits.map((h) => h.en),
    ['1st AC'],
    'CMS plural role canonicalizes to singular',
  )

  const map = buildPhraseMap([{en: '1st AC', zh: '第一助理摄影'}])
  assert.equal(lookupPhrase(map, '1st ACs'), '第一助理摄影')
  assert.equal(lookupPhrase(map, '1st AC'), '第一助理摄影')

  const rows = buildPhraseTableRows({
    hits: [
      {
        en: '1st AC',
        source: 'catalog:role:1st_ac',
        category: 'crew-roles',
      },
      {
        en: '1st AC',
        source: 'cms',
        category: 'crew-roles',
        documentId: 'p1',
        documentType: 'portfolioEntry',
        enPath: 'crewCredits[].role',
      },
    ],
    phrases: [{_id: 'phrase.1st-ac', en: '1st AC', zh: '第一助理摄影'}],
  })
  assert.equal(rows.filter((r) => r.en === '1st AC').length, 1)
  assert.equal(rows.find((r) => r.en === '1st ACs'), undefined)
}

function testBuildTableRows() {
  const rows = buildPhraseTableRows({
    hits: [
      {
        en: 'DJI',
        source: 'a',
        category: 'companies',
        documentId: 'p1',
        documentType: 'portfolioEntry',
        enPath: 'crewCredits[].people.name',
      },
      {
        en: 'DJI',
        source: 'b',
        category: 'companies',
        documentId: 'drafts.p1',
        documentType: 'portfolioEntry',
        enPath: 'crewCredits[].people.name',
      },
      {
        en: 'DJI',
        source: 'c',
        category: 'companies',
        documentId: 'p2',
        documentType: 'portfolioEntry',
        enPath: 'displayTitleParts.brandName',
      },
      {
        en: 'Halloween',
        source: 'd',
        category: 'campaigns',
        documentId: 'p1',
        documentType: 'portfolioEntry',
        enPath: 'displayTitleParts.campaignTitle',
      },
      {
        en: 'Director',
        source: 'catalog:role:director',
        category: 'crew-roles',
      },
    ],
    phrases: [{_id: 'phrase.dji', en: 'DJI', zh: '大疆'}],
  })
  const dji = rows.find((r) => r.en === 'DJI')!
  assert.equal(dji.useCount, 2, 'draft+published of p1 count once')
  assert.equal(dji.status, 'present')
  assert.equal(dji.category, 'companies')
  const halloween = rows.find((r) => r.en === 'Halloween')!
  assert.equal(halloween.status, 'missing')
  assert.equal(halloween.useCount, 1)
  const director = rows.find((r) => r.en === 'Director')!
  assert.equal(director.useCount, 0, 'catalog-only roles have 0 uses')

  // document_field: filled Zh sibling → present without phrase-book entry
  const withDoc = buildPhraseTableRows({
    hits: [
      {
        en: 'Halloween',
        source: 'd',
        category: 'campaigns',
        documentId: 'p1',
        documentType: 'portfolioEntry',
        enPath: 'displayTitleParts.campaignTitle',
      },
    ],
    phrases: [],
    docs: [
      {
        _id: 'p1',
        _type: 'portfolioEntry',
        displayTitleParts: {
          campaignTitle: 'Halloween',
          campaignTitleZh: '万圣节',
        },
      },
    ],
  })
  assert.equal(withDoc.find((r) => r.en === 'Halloween')!.status, 'present')
}

function testSpanDetect() {
  assert.equal(phraseContainsSpan('<span>DJI</span>'), true)
  assert.equal(phraseContainsSpan('DJI'), false)
}

for (const test of [
  testNormalize,
  testIdsStableAndCaseSensitive,
  testLookupAndResolve,
  testClassifyUnused,
  testCategories,
  testInterfaceVsPagesNewsCodeRows,
  testCollectCompanySources,
  testCrewRolePluralCanonical,
  testBuildTableRows,
  testSpanDetect,
]) {
  test()
  console.log(`ok ${test.name}`)
}
console.log('\n10 passed')
