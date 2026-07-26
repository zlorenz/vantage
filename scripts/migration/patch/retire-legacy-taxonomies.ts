/**
 * Stop relying on portfolioEntry.clients / crewMembers.
 *
 * Clears those arrays (optional) after creditIdentity linking is done.
 * Legacy client / crewMember documents are left in place but unused.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/retire-legacy-taxonomies.ts
 *   npx tsx scripts/migration/patch/retire-legacy-taxonomies.ts --apply
 *   npx tsx scripts/migration/patch/retire-legacy-taxonomies.ts --apply --clear
 */

import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')
const CLEAR = process.argv.includes('--clear')

async function main() {
  const client = getWriteClient()

  const docs = await client.fetch<
    Array<{
      _id: string
      title?: string
      slug?: string
      clients?: unknown[]
      crewMembers?: unknown[]
    }>
  >(
    `*[_type == "portfolioEntry" && (count(clients) > 0 || count(crewMembers) > 0)]{
      _id,
      title,
      "slug": slug.current,
      clients,
      crewMembers
    }`,
  )

  console.log(
    `${APPLY ? 'APPLY' : 'DRY-RUN'}: ${docs?.length ?? 0} portfolio entries still have clients/crewMembers arrays`,
  )

  if (!CLEAR) {
    console.log(
      'Pass --clear (with --apply) to set clients/crewMembers to empty arrays. Leaving documents intact otherwise.',
    )
    return
  }

  let patched = 0
  for (const doc of docs ?? []) {
    const label = doc.slug || doc.title || doc._id
    console.log(
      `${APPLY ? 'CLEAR' : 'WOULD CLEAR'} ${label} — clients=${doc.clients?.length ?? 0} crew=${doc.crewMembers?.length ?? 0}`,
    )
    if (APPLY) {
      await client
        .patch(doc._id)
        .set({clients: [], crewMembers: []})
        .commit({returnDocuments: false})
      patched += 1
    }
  }

  console.log(`${APPLY ? 'Cleared' : 'Would clear'} ${patched || docs?.length || 0} entries`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
