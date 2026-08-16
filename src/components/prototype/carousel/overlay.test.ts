/**
 *   npx tsx src/components/prototype/carousel/overlay.test.ts
 */

import assert from 'node:assert/strict';
import {composeOverlayCopy, joinOverlayList} from './overlay';

function testCampaignPresentJoinsBrandProduct() {
  const result = composeOverlayCopy({
    brandName: 'realme',
    productName: '15 Series 5G',
    campaignTitle: 'Live Real in Every Shot',
  });
  assert.equal(result.brandLine, 'realme 15 Series 5G');
  assert.equal(result.campaignLine, 'Live Real in Every Shot');
}

function testCampaignPresentOmitsNullProduct() {
  const result = composeOverlayCopy({
    brandName: 'Banyan Tree',
    productName: null,
    campaignTitle: "There's More to Discovery",
  });
  assert.equal(result.brandLine, 'Banyan Tree');
  assert.equal(result.campaignLine, "There's More to Discovery");
}

function testCampaignMissingUsesBrandOnlyKicker() {
  const result = composeOverlayCopy({
    brandName: 'TPBank',
    productName: 'App',
    campaignTitle: null,
  });
  assert.equal(result.brandLine, 'TPBank');
  assert.equal(result.campaignLine, 'TPBank App');
}

function testJoinOverlayList() {
  assert.equal(joinOverlayList(['Commercial Spot']), 'Commercial Spot');
  assert.equal(
    joinOverlayList(['Commercial Spot', 'Product Video']),
    'Commercial Spot, Product Video',
  );
  assert.equal(joinOverlayList(['Kelvin Chew', 'Nghia Minh Phan']), 'Kelvin Chew, Nghia Minh Phan');
  assert.equal(joinOverlayList(['Brand Film', null, '  ']), 'Brand Film');
}

const tests = [
  testCampaignPresentJoinsBrandProduct,
  testCampaignPresentOmitsNullProduct,
  testCampaignMissingUsesBrandOnlyKicker,
  testJoinOverlayList,
];

for (const test of tests) {
  test();
  console.log(`ok ${test.name}`);
}

console.log(`\n${tests.length} passed`);
