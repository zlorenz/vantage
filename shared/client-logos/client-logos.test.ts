/**
 * Disk ↔ registry parity for client logos.
 *
 * Catches a deleted/renamed SVG silently breaking the homepage logo wall —
 * a failure mode Studio field validation cannot see.
 *
 * Run: npx tsx shared/client-logos/client-logos.test.ts
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {CLIENT_LOGOS} from './index.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const logosDir = path.join(root, 'public/logos')

const diskSvgs = fs.readdirSync(logosDir).filter((f) => f.endsWith('.svg'))
const registryBasenames = new Set(CLIENT_LOGOS.map((l) => path.basename(l.file)))

const missingOnDisk = CLIENT_LOGOS.filter((logo) => {
  const abs = path.join(root, 'public', logo.file.replace(/^\//, ''))
  return !fs.existsSync(abs)
}).map((l) => ({id: l.id, file: l.file}))

const orphanOnDisk = diskSvgs.filter((f) => !registryBasenames.has(f))

assert.equal(
  missingOnDisk.length,
  0,
  `Registry entries missing SVG on disk: ${JSON.stringify(missingOnDisk)}`,
)
assert.equal(
  orphanOnDisk.length,
  0,
  `SVGs in public/logos/ with no registry entry: ${JSON.stringify(orphanOnDisk)}`,
)
assert.equal(CLIENT_LOGOS.length, diskSvgs.length)

console.log(`ok — ${CLIENT_LOGOS.length} logos; registry ↔ public/logos/ parity`)
