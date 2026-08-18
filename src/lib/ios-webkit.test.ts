/**
 *   npx tsx src/lib/ios-webkit.test.ts
 */

import assert from 'node:assert/strict';
import {isIOSWebKitUserAgent} from './ios-webkit';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1';
const IPHONE_FIREFOX =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15';
const IPAD_LEGACY =
  'Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP_MODE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const WINDOWS_TOUCH_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

function testIphoneBrowsersAllDetected() {
  // All three are WebKit on iOS, so all three need the HLS path.
  assert.equal(isIOSWebKitUserAgent(IPHONE_SAFARI, 5), true);
  assert.equal(isIOSWebKitUserAgent(IPHONE_CHROME, 5), true);
  assert.equal(isIOSWebKitUserAgent(IPHONE_FIREFOX, 5), true);
}

function testLegacyIpadDetected() {
  assert.equal(isIOSWebKitUserAgent(IPAD_LEGACY, 5), true);
}

function testIpadInDesktopModeDetectedByTouchPoints() {
  assert.equal(isIOSWebKitUserAgent(IPAD_DESKTOP_MODE, 5), true);
}

function testRealMacNotDetected() {
  assert.equal(isIOSWebKitUserAgent(MAC_SAFARI, 0), false);
  assert.equal(isIOSWebKitUserAgent(MAC_CHROME, 0), false);
}

/** Same UA as an iPad in desktop mode — only maxTouchPoints separates them. */
function testMacUaWithoutTouchIsNotIpad() {
  assert.equal(isIOSWebKitUserAgent(IPAD_DESKTOP_MODE, 0), false);
  assert.equal(isIOSWebKitUserAgent(IPAD_DESKTOP_MODE, 1), false);
}

function testNonAppleTouchDevicesNotDetected() {
  // A touchscreen Windows laptop reports maxTouchPoints > 1 but is not Mac-like.
  assert.equal(isIOSWebKitUserAgent(WINDOWS_TOUCH_CHROME, 10), false);
  assert.equal(isIOSWebKitUserAgent(ANDROID_CHROME, 5), false);
}

const tests = [
  testIphoneBrowsersAllDetected,
  testLegacyIpadDetected,
  testIpadInDesktopModeDetectedByTouchPoints,
  testRealMacNotDetected,
  testMacUaWithoutTouchIsNotIpad,
  testNonAppleTouchDevicesNotDetected,
];

for (const test of tests) {
  test();
  console.log(`ok ${test.name}`);
}

console.log(`\n${tests.length} passed`);
