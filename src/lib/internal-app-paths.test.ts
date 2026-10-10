/**
 *   npx tsx src/lib/internal-app-paths.test.ts
 */

import assert from 'node:assert/strict';
import {
  isInternalAppChromePath,
  isShowreelEditorChromePath,
  isWorkInternalPath,
} from './internal-app-paths';

assert.equal(isWorkInternalPath('/work-internal'), true);
assert.equal(isWorkInternalPath('/work-internal/foo'), true);
assert.equal(isWorkInternalPath('/'), false);

assert.equal(isShowreelEditorChromePath('/showreels'), true);
assert.equal(isShowreelEditorChromePath('/showreel/login'), true);
assert.equal(isShowreelEditorChromePath('/showreel/abc/edit'), true);
assert.equal(isShowreelEditorChromePath('/showreel/abc'), false);

assert.equal(isInternalAppChromePath('/work-internal'), true);
assert.equal(isInternalAppChromePath('/showreel/x/edit'), true);
assert.equal(isInternalAppChromePath('/'), false);
assert.equal(isInternalAppChromePath('/', 'app.localhost'), true);
assert.equal(isInternalAppChromePath('/some-slug', 'app.vantage.pictures'), true);
assert.equal(isInternalAppChromePath('/', 'localhost'), false);
assert.equal(isInternalAppChromePath('/about', 'vantage.pictures'), false);

console.log('internal-app-paths.test.ts: ok');
