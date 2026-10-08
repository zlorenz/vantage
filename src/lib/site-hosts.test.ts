/**
 * Unit checks for marketing vs app host helpers.
 */

import assert from 'node:assert/strict'
import {
  getAppHostname,
  getSiteHostname,
  hostnameFromHostHeader,
  isAllowedVantageBrowserOrigin,
  isAppHostname,
  isAppHostReservedSegment,
} from './site-hosts'

assert.equal(hostnameFromHostHeader('app.vantage.pictures:443'), 'app.vantage.pictures')
assert.equal(hostnameFromHostHeader('Vantage.Pictures'), 'vantage.pictures')

assert.equal(isAppHostname('app.vantage.pictures'), true)
assert.equal(isAppHostname('app.localhost'), true)
assert.equal(isAppHostname('vantage.pictures'), false)
assert.equal(isAppHostname('www.vantage.pictures'), false)

assert.equal(isAppHostReservedSegment('showreel'), true)
assert.equal(isAppHostReservedSegment('about'), true)
assert.equal(isAppHostReservedSegment('mammotion-luba-3-awd'), false)

assert.equal(getSiteHostname().includes('.'), true)
assert.equal(getAppHostname().startsWith('app.') || getAppHostname() === 'app.localhost', true)

assert.equal(
  isAllowedVantageBrowserOrigin('https://app.vantage.pictures'),
  true,
)
assert.equal(
  isAllowedVantageBrowserOrigin('https://vantage.pictures'),
  true,
)
assert.equal(
  isAllowedVantageBrowserOrigin('https://evil.example'),
  false,
)

console.log('site-hosts.test.ts: ok')
