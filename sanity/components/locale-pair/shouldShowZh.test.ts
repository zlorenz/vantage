import assert from 'node:assert/strict'
import {hasLocaleText, shouldShowZh} from './shouldShowZh'

assert.equal(shouldShowZh('', ''), false)
assert.equal(shouldShowZh('  ', ''), false)
assert.equal(shouldShowZh('Govee', ''), true)
assert.equal(shouldShowZh('', '戈维'), true)
assert.equal(shouldShowZh('Govee', '戈维'), true)
assert.equal(shouldShowZh({current: 'slug'}, ''), true)
assert.equal(shouldShowZh('', {current: '中文'}), true)
assert.equal(shouldShowZh({current: '  '}, ''), false)
assert.equal(hasLocaleText([{_type: 'block'}]), true)
assert.equal(hasLocaleText([]), false)

console.log('ok shouldShowZh')
