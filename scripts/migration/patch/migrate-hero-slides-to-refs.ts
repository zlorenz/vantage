/**
 * Convert page-home.heroSlides from heroSlide objects → portfolio references
 * (Featured Work–style) and drop buttonLabel fields.
 *
 * Usage: npx tsx scripts/migration/patch/migrate-hero-slides-to-refs.ts
 */

import {pageId} from '../lib/ids'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

type LegacySlide = {
  _key?: string
  _type?: string
  portfolioRef?: {_ref?: string; _type?: string}
  _ref?: string
  buttonLabel?: unknown
  buttonLabelZh?: unknown
}

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

async function main() {
  const client = getWriteClient()
  const homeId = pageId('home')

  const doc = await client.fetch<{heroSlides?: LegacySlide[]} | null>(
    `*[_id == $id][0]{ heroSlides }`,
    {id: homeId},
  )

  const legacy = doc?.heroSlides ?? []
  if (!legacy.length) {
    console.log(`${homeId}: no heroSlides — nothing to do`)
    return
  }

  const alreadyRefs = legacy.every(
    (slide) => slide._type === 'reference' && typeof slide._ref === 'string',
  )
  if (alreadyRefs) {
    console.log(`${homeId}: heroSlides already reference array — nothing to do`)
    return
  }

  const next = legacy
    .map((slide) => {
      const ref = slide.portfolioRef?._ref ?? slide._ref
      if (!ref) return null
      return {
        _type: 'reference' as const,
        _ref: ref,
        _key: slide._key || newKey(),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item != null)

  await client.patch(homeId).set({heroSlides: next}).commit()
  console.log(
    `Migrated ${next.length} heroSlides on ${homeId} to portfolio references`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
