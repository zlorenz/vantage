/**
 * Promote blogPost.redesignBody* → body* (live article content wins),
 * then unset the parallel redesign fields.
 *
 * Dry-run (default):
 *   npx tsx scripts/migration/patch/promote-blog-redesign-body.ts
 *
 * Apply (ONLY after Zach explicit go-ahead + dataset backup):
 *   npx tsx scripts/migration/patch/promote-blog-redesign-body.ts --apply
 */

import {createClient} from '@sanity/client'
import {SANITY} from '../config'
import {getWriteClient} from '../lib/sanity-client'

const APPLY = process.argv.includes('--apply')

type PtBlock = unknown[]

type BlogRow = {
  _id: string
  title?: string | null
  slug?: string | null
  body?: PtBlock | null
  bodyZh?: PtBlock | null
  redesignBody?: PtBlock | null
  redesignBodyZh?: PtBlock | null
}

function jsonLen(value: unknown): number {
  if (value == null) return 0
  return JSON.stringify(value).length
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

async function main() {
  const read = createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: SANITY.token || undefined,
    useCdn: false,
  })

  const rows = await read.fetch<BlogRow[]>(`
    *[_type == "blogPost" && !defined(trash.trashedAt)] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      body,
      bodyZh,
      redesignBody,
      redesignBodyZh
    }
  `)

  console.log(`Posts: ${rows.length}  mode=${APPLY ? 'APPLY' : 'dry-run'}`)

  let promoteEn = 0
  let promoteZh = 0
  let unsetOnly = 0
  let driftKeepBody = 0

  const write = APPLY ? getWriteClient() : null

  for (const row of rows) {
    const hasRb = Array.isArray(row.redesignBody) && row.redesignBody.length > 0
    const hasRbZh =
      Array.isArray(row.redesignBodyZh) && row.redesignBodyZh.length > 0
    const hasBody = Array.isArray(row.body) && row.body.length > 0
    const hasBodyZh = Array.isArray(row.bodyZh) && row.bodyZh.length > 0

    const enDiffers = hasRb && !sameJson(row.redesignBody, row.body)
    const zhDiffers = hasRbZh && !sameJson(row.redesignBodyZh, row.bodyZh)

    if (enDiffers || zhDiffers) {
      console.log(
        `- ${row.slug ?? row._id}: EN ${hasRb ? `rb=${jsonLen(row.redesignBody)} body=${jsonLen(row.body)} ${enDiffers ? 'DIFF' : 'same'}` : 'no-rb'} | ZH ${hasRbZh ? `rb=${jsonLen(row.redesignBodyZh)} body=${jsonLen(row.bodyZh)} ${zhDiffers ? 'DIFF' : 'same'}` : 'no-rb'}`,
      )
    }

    const set: Record<string, unknown> = {}
    const unset: string[] = []

    // Live page shows redesignBody* today — promote that into body*.
    if (hasRb) {
      if (enDiffers || !hasBody) {
        set.body = row.redesignBody
        promoteEn++
      }
      unset.push('redesignBody')
    } else if (hasBody) {
      driftKeepBody++
    }

    if (hasRbZh) {
      if (zhDiffers || !hasBodyZh) {
        set.bodyZh = row.redesignBodyZh
        promoteZh++
      }
      unset.push('redesignBodyZh')
    }

    if (unset.length === 0 && Object.keys(set).length === 0) {
      continue
    }
    if (Object.keys(set).length === 0 && unset.length > 0) {
      unsetOnly++
    }

    if (!APPLY || !write) continue

    let patch = write.patch(row._id)
    if (Object.keys(set).length > 0) patch = patch.set(set)
    if (unset.length > 0) patch = patch.unset(unset)
    await patch.commit({autoGenerateArrayKeys: true})
  }

  console.log(
    `Summary: promoteEn=${promoteEn} promoteZh=${promoteZh} unsetOnly=${unsetOnly} bodyOnlyNoRedesign=${driftKeepBody}`,
  )
  if (!APPLY) {
    console.log('Dry-run only. Re-run with --apply after backup + approval.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
