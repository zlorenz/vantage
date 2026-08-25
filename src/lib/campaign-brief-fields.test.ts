/**
 *   npx tsx src/lib/campaign-brief-fields.test.ts
 */

import assert from 'node:assert/strict';

import { isValidEmail } from './campaign-brief-fields';

function testAcceptsCommonAddresses() {
  assert.equal(isValidEmail('zglorenz@gmail.com'), true);
  assert.equal(isValidEmail('user.name+tag@sub.domain.co.uk'), true);
  assert.equal(isValidEmail('  spaced@example.org  '), true);
}

function testRejectsTrailingPunctuationTypos() {
  assert.equal(isValidEmail("zglorenz@gmail.com'"), false);
  assert.equal(isValidEmail('zglorenz@gmail.com*'), false);
  assert.equal(isValidEmail('zglorenz@gmail.com.'), false);
  assert.equal(isValidEmail('zglorenz@gmail.com,'), false);
}

function testRejectsMalformed() {
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail('missing-domain@'), false);
  assert.equal(isValidEmail('@nodomain.com'), false);
  assert.equal(isValidEmail('no-tld@domain'), false);
  assert.equal(isValidEmail('spaces in@email.com'), false);
}

testAcceptsCommonAddresses();
testRejectsTrailingPunctuationTypos();
testRejectsMalformed();

console.log('campaign-brief-fields.test.ts: ok');
