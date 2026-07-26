/**
 * Remove founder bio / bioZh / sameAs from page documents (About team cards
 * only keep name, job title, and photo).
 *
 * Usage: npx tsx scripts/migration/patch/strip-founder-bio-sameas.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import {getWriteClient} from '../lib/sanity-client'
import '../config'

type FounderItem = Record<string, unknown> & {
  bio?: unknown
  bioZh?: unknown
  sameAs?: unknown
}

async function main() {
  const client = getWriteClient()
  const pages = await client.fetch<
    {_id: string; title?: string; founders?: FounderItem[]}[]
  >(`*[_type == "page" && defined(founders) && count(founders) > 0]{
    _id,
    title,
    founders
  }`)

  let patched = 0
  for (const page of pages) {
    const founders = page.founders ?? []
    const needsStrip = founders.some(
      (f) => f.bio != null || f.bioZh != null || f.sameAs != null,
    )
    if (!needsStrip) {
      console.log(`skip ${page._id} (${page.title ?? 'untitled'}) — already clean`)
      continue
    }

    const next = founders.map((founder) => {
      const cleaned = {...founder}
      delete cleaned.bio
      delete cleaned.bioZh
      delete cleaned.sameAs
      return cleaned
    })

    await client.patch(page._id).set({founders: next}).commit()
    patched += 1
    console.log(
      `stripped bio/sameAs on ${page._id} (${page.title ?? 'untitled'}, ${next.length} founders)`,
    )
  }

  console.log(`Done. Patched ${patched} / ${pages.length} page(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
