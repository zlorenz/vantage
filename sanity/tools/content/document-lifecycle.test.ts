/**
 * Lightweight unit checks for trash lifecycle helpers.
 *   npx tsx tools/content/document-lifecycle.test.ts
 */

import assert from 'node:assert/strict'
import {TRASH_RETENTION_DAYS} from '@trash-retention'
import {
  formatImpactSummary,
  purgeAfterFrom,
  summarizeImpacts,
  trashRecordId,
  type RemovedReferenceBackup,
} from './document-lifecycle'

const backups: RemovedReferenceBackup[] = [
  {
    referrerId: 'drafts.page-home',
    referrerPublishedId: 'page-home',
    referrerType: 'page',
    referrerTitle: 'Home',
    path: 'heroSlides',
    kind: 'arrayItem',
    itemKey: 'abc',
    valueJson: '{}',
  },
  {
    referrerId: 'drafts.page-home',
    referrerPublishedId: 'page-home',
    referrerType: 'page',
    referrerTitle: 'Home',
    path: 'heroSlides',
    kind: 'arrayItem',
    itemKey: 'def',
    valueJson: '{}',
  },
]

const impacts = summarizeImpacts(backups)
assert.equal(impacts.length, 1)
assert.equal(impacts[0].count, 2)
assert.equal(impacts[0].referrerTitle, 'Home')

const summary = formatImpactSummary(impacts)
assert.match(summary, /Home/)
assert.match(summary, /heroSlides/)

assert.equal(trashRecordId('portfolio-1'), 'trashRecord.portfolio-1')

const from = new Date('2026-07-19T00:00:00.000Z')
const purge = new Date(purgeAfterFrom(from))
const diffDays = Math.round(
  (purge.getTime() - from.getTime()) / (24 * 60 * 60 * 1000),
)
assert.equal(diffDays, TRASH_RETENTION_DAYS)

console.log('document-lifecycle.test.ts: all assertions passed')
