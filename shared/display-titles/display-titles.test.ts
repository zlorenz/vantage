/**
 * Unit checks for display-title compile / resolve.
 *   npx tsx shared/display-titles/display-titles.test.ts
 */

import assert from 'node:assert/strict'

import {compileDisplayTitles, resolveDisplayTitles} from './index'

function testCompileMammotion() {
  const result = compileDisplayTitles({
    brandName: 'Mammotion',
    productName: 'LUBA Mini AWD',
    campaignTitle: 'Compact, Powerful & Ready to Conquer Your Lawn',
  })
  assert.equal(
    result.longTitle,
    'Mammotion LUBA Mini AWD<span class="vp-outline"> Compact, Powerful & Ready to Conquer Your Lawn </span>',
  )
  // Header outlines the campaign (matches longTitle + live site). Changed from product-first 2026-07.
  assert.equal(
    result.headerTitle,
    'Mammotion<span class="vp-outline"> Compact, Powerful & Ready to Conquer Your Lawn </span>',
  )
  assert.equal(result.thumbTitle, 'Mammotion LUBA Mini AWD')
  assert.equal(
    result.documentTitle,
    'Mammotion LUBA Mini AWD – Compact, Powerful & Ready to Conquer Your Lawn',
  )
}

function testCompileBrandOnly() {
  const result = compileDisplayTitles({brandName: 'Aquafina'})
  assert.equal(result.thumbTitle, 'Aquafina')
  assert.equal(result.headerTitle, 'Aquafina')
  assert.equal(result.longTitle, 'Aquafina')
  assert.equal(result.documentTitle, 'Aquafina')
}

function testCompileBrandProductNoCampaign() {
  const result = compileDisplayTitles({
    brandName: 'Ulike',
    productName: 'Air 10',
  })
  assert.equal(result.thumbTitle, 'Ulike Air 10')
  assert.equal(
    result.headerTitle,
    'Ulike<span class="vp-outline"> Air 10 </span>',
  )
  assert.equal(
    result.longTitle,
    'Ulike<span class="vp-outline"> Air 10 </span>',
  )
  assert.equal(result.documentTitle, 'Ulike Air 10')
}

function testCompileBrandCampaignNoProduct() {
  const result = compileDisplayTitles({
    brandName: 'Aquafina',
    campaignTitle: 'Vietnam',
  })
  assert.equal(result.thumbTitle, 'Aquafina Vietnam')
  assert.equal(
    result.headerTitle,
    'Aquafina<span class="vp-outline"> Vietnam </span>',
  )
  assert.equal(
    result.longTitle,
    'Aquafina<span class="vp-outline"> Vietnam </span>',
  )
  assert.equal(result.documentTitle, 'Aquafina – Vietnam')
}

function testCompileThumbOmitsLongCampaign() {
  const violoop = compileDisplayTitles({
    brandName: 'VioLoop',
    campaignTitle: 'AI Agent for your PC',
  })
  assert.equal(violoop.thumbTitle, 'VioLoop')
  assert.equal(
    violoop.headerTitle,
    'VioLoop<span class="vp-outline"> AI Agent for your PC </span>',
  )

  const govee = compileDisplayTitles({
    brandName: 'Govee',
    campaignTitle: 'For Every Mood of Home',
  })
  assert.equal(govee.thumbTitle, 'Govee')

  const shortCampaign = compileDisplayTitles({
    brandName: 'Govee',
    campaignTitle: 'Unstoppable Fun',
  })
  assert.equal(shortCampaign.thumbTitle, 'Govee Unstoppable Fun')
}

function testCompileThumbOmitsLongProductPrefersShortCampaign() {
  const longProduct = compileDisplayTitles({
    brandName: 'Bambu Lab',
    productName: 'Vortek Hotend Change System',
  })
  assert.equal(longProduct.thumbTitle, 'Bambu Lab')

  const longProductShortCampaign = compileDisplayTitles({
    brandName: 'Bitget',
    productName: 'GetAgent ft. Julián Álvarez',
    campaignTitle: 'Trade Smarter',
  })
  // Product too long → fall back to short campaign
  assert.equal(longProductShortCampaign.thumbTitle, 'Bitget Trade Smarter')
}

function testCompileThumbKeepsShortProductOverCampaign() {
  const result = compileDisplayTitles({
    brandName: 'Mammotion',
    productName: 'LUBA Mini AWD',
    campaignTitle: 'Compact, Powerful & Ready to Conquer Your Lawn',
  })
  assert.equal(result.thumbTitle, 'Mammotion LUBA Mini AWD')
}

function testCompileHeaderMatchesThumbPartsWithoutCapOrBreak() {
  // Long campaign omitted from thumb, but header still uses it (no length cap), outlined, no <br>.
  const longCampaign = compileDisplayTitles({
    brandName: 'VioLoop',
    campaignTitle: 'AI Agent for your PC',
  })
  assert.equal(longCampaign.thumbTitle, 'VioLoop')
  assert.equal(
    longCampaign.headerTitle,
    'VioLoop<span class="vp-outline"> AI Agent for your PC </span>',
  )
  assert.ok(!longCampaign.headerTitle.includes('<br>'))

  // Campaign present → header outlines campaign even when a long product exists.
  const longProduct = compileDisplayTitles({
    brandName: 'Bambu Lab',
    productName: 'Vortek Hotend Change System',
    campaignTitle: 'Trade Smarter',
  })
  assert.equal(longProduct.thumbTitle, 'Bambu Lab Trade Smarter')
  // Header outlines the campaign (matches longTitle + live site). Changed from product-first 2026-07.
  assert.equal(
    longProduct.headerTitle,
    'Bambu Lab<span class="vp-outline"> Trade Smarter </span>',
  )
  assert.ok(!longProduct.headerTitle.includes('<br>'))
}

function testCompileDualBrand() {
  const result = compileDisplayTitles({
    brandName: 'Samsung x Discovery',
    campaignTitle: 'Explore Life Refocused with the Galaxy S21',
  })
  // Long campaign omitted from thumb
  assert.equal(result.thumbTitle, 'Samsung x Discovery')
  assert.equal(
    result.documentTitle,
    'Samsung x Discovery – Explore Life Refocused with the Galaxy S21',
  )
}

function testCompileHeroFilmTitle() {
  const bitget = compileDisplayTitles({
    brandName: 'Bitget',
    campaignTitle: 'Elite Traders',
    heroFilmTitle: 'Matthew (AlphanumetriX)',
  })
  assert.equal(
    bitget.headerTitle,
    'Bitget<span class="vp-outline"> Elite Traders </span>',
  )
  assert.equal(
    bitget.longTitle,
    'Bitget Elite Traders<span class="vp-outline"> Matthew (AlphanumetriX) </span>',
  )
  assert.equal(bitget.documentTitle, 'Bitget – Elite Traders')
  assert.equal(bitget.thumbTitle, 'Bitget Elite Traders')

  const oppo = compileDisplayTitles({
    brandName: 'OPPO',
    productName: 'Reno10 Pro+ 5G',
    heroFilmTitle: 'Fast Charging',
  })
  assert.equal(
    oppo.headerTitle,
    'OPPO<span class="vp-outline"> Reno10 Pro+ 5G </span>',
  )
  assert.equal(
    oppo.longTitle,
    'OPPO Reno10 Pro+ 5G<span class="vp-outline"> Fast Charging </span>',
  )
  assert.equal(oppo.documentTitle, 'OPPO Reno10 Pro+ 5G')
}

function testResolveOverride() {
  const withOverride = resolveDisplayTitles(
    {
      brandName: 'Govee',
      productName: 'Outdoor Lights',
      thumbTitleOverride: 'GOVEE<br>CUSTOM',
    },
    'en',
  )
  assert.equal(withOverride.thumbTitle, 'GOVEE<br>CUSTOM')
  assert.equal(
    withOverride.headerTitle,
    'Govee<span class="vp-outline"> Outdoor Lights </span>',
  )

  const noParts = resolveDisplayTitles({}, 'en')
  assert.equal(noParts.thumbTitle, '')
  assert.equal(noParts.headerTitle, '')
  assert.equal(noParts.longTitle, '')
}

function testResolveZhFallback() {
  const result = resolveDisplayTitles(
    {
      brandName: 'Govee',
      productName: 'Outdoor Lights',
      brandNameZh: 'Govee',
      productNameZh: '户外灯',
    },
    'zh',
  )
  assert.equal(result.thumbTitle, 'Govee 户外灯')
}

const tests = [
  testCompileMammotion,
  testCompileBrandOnly,
  testCompileBrandProductNoCampaign,
  testCompileBrandCampaignNoProduct,
  testCompileThumbOmitsLongCampaign,
  testCompileThumbOmitsLongProductPrefersShortCampaign,
  testCompileThumbKeepsShortProductOverCampaign,
  testCompileHeaderMatchesThumbPartsWithoutCapOrBreak,
  testCompileDualBrand,
  testCompileHeroFilmTitle,
  testResolveOverride,
  testResolveZhFallback,
]

for (const test of tests) {
  test()
  console.log(`ok ${test.name}`)
}

console.log(`\n${tests.length} passed`)
