/**
 * Unset orphaned seo.focusKeyword from documents after schema removal.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/unset-focus-keyword.ts
 *   npx tsx scripts/migration/patch/unset-focus-keyword.ts --apply
 */

import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

async function main() {
  const client = getWriteClient()

  const docs = await client.fetch<
    Array<{
      _id: string
      _type: string
      title?: string
      focusKeyword?: string
    }>
  >(
    `*[defined(seo.focusKeyword)]{
      _id,
      _type,
      title,
      "focusKeyword": seo.focusKeyword
    }`,
  )

  console.log(
    `${APPLY ? 'APPLY' : 'DRY-RUN'}: unset seo.focusKeyword on ${docs.length} document(s)`,
  )

  let patched = 0
  for (const doc of docs) {
    const label = doc.title || doc._id
    console.log(
      `  ${APPLY ? 'UNSET' : 'WOULD UNSET'} ${doc._type} ${label} — "${doc.focusKeyword}"`,
    )
    if (APPLY) {
      await client.patch(doc._id).unset(['seo.focusKeyword']).commit()
      patched++
    }
  }

  if (APPLY) {
    console.log(`Patched ${patched} document(s)`)
  } else {
    console.log('Pass --apply to write changes.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
