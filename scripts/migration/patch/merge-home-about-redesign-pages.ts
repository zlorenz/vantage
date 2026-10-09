/**
 * Copy redesign stub page fields onto canonical home / about, then optionally
 * delete the stub documents.
 *
 * Dry-run (default):
 *   npx tsx scripts/migration/patch/merge-home-about-redesign-pages.ts
 *
 * Apply field copy:
 *   npx tsx scripts/migration/patch/merge-home-about-redesign-pages.ts --apply
 *
 * Apply + delete stubs (after code retargets queries):
 *   npx tsx scripts/migration/patch/merge-home-about-redesign-pages.ts --apply --delete-stubs
 */

import {createClient} from '@sanity/client'
import {SANITY} from '../config'
import {getWriteClient} from '../lib/sanity-client'

const APPLY = process.argv.includes('--apply')
const DELETE_STUBS = process.argv.includes('--delete-stubs')

const HOME_FIELDS = ['carouselSlides'] as const
const ABOUT_FIELDS = [
  'specialties',
  'advantages',
  'productionServicesCta',
  'productionLogCta',
  'statementMarkers',
  'statementFilmStrip',
] as const

type PageRow = {
  _id: string
  _type: string
  title?: string | null
  slug?: string | null
  carouselSlides?: unknown
  specialties?: unknown
  advantages?: unknown
  productionServicesCta?: unknown
  productionLogCta?: unknown
  statementMarkers?: unknown
  statementFilmStrip?: unknown
}

function fieldPreview(value: unknown): string {
  if (value == null) return 'null'
  if (Array.isArray(value)) return `array(${value.length})`
  if (typeof value === 'object') return 'object'
  return String(value)
}

async function fetchBySlug(
  client: ReturnType<typeof createClient>,
  slug: string,
): Promise<PageRow | null> {
  return client.fetch(
    `*[_type == "page" && slug.current == $slug && !defined(trash.trashedAt)][0]{
      _id, _type, title, "slug": slug.current,
      carouselSlides, specialties, advantages,
      productionServicesCta, productionLogCta,
      statementMarkers, statementFilmStrip
    }`,
    {slug},
  )
}

async function main() {
  const read = createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: SANITY.token || undefined,
    useCdn: false,
  })

  console.log(
    `mode=${APPLY ? 'APPLY' : 'dry-run'} deleteStubs=${DELETE_STUBS}`,
  )

  const home = await fetchBySlug(read, 'home')
  const homeRedesign = await fetchBySlug(read, 'home-redesign')
  const about = await fetchBySlug(read, 'about')
  const aboutRedesign = await fetchBySlug(read, 'about-redesign')

  if (!home) throw new Error('Canonical page "home" not found')
  if (!about) throw new Error('Canonical page "about" not found')
  if (!homeRedesign) throw new Error('Stub page "home-redesign" not found')
  if (!aboutRedesign) throw new Error('Stub page "about-redesign" not found')

  console.log(`home=${home._id}  home-redesign=${homeRedesign._id}`)
  console.log(`about=${about._id}  about-redesign=${aboutRedesign._id}`)

  const homeSet: Record<string, unknown> = {}
  for (const key of HOME_FIELDS) {
    const from = homeRedesign[key]
    const to = home[key]
    console.log(
      `  home.${key}: stub=${fieldPreview(from)} → canonical was ${fieldPreview(to)}`,
    )
    if (from != null) homeSet[key] = from
  }

  const aboutSet: Record<string, unknown> = {}
  for (const key of ABOUT_FIELDS) {
    const from = aboutRedesign[key]
    const to = about[key]
    console.log(
      `  about.${key}: stub=${fieldPreview(from)} → canonical was ${fieldPreview(to)}`,
    )
    if (from != null) aboutSet[key] = from
  }

  if (!APPLY) {
    console.log('Dry-run only. Re-run with --apply after backup + approval.')
    return
  }

  const write = getWriteClient()
  if (Object.keys(homeSet).length > 0) {
    await write.patch(home._id).set(homeSet).commit({autoGenerateArrayKeys: true})
    console.log(`Patched home (${Object.keys(homeSet).join(', ')})`)
  }
  if (Object.keys(aboutSet).length > 0) {
    await write
      .patch(about._id)
      .set(aboutSet)
      .commit({autoGenerateArrayKeys: true})
    console.log(`Patched about (${Object.keys(aboutSet).join(', ')})`)
  }

  if (DELETE_STUBS) {
    await write.delete(homeRedesign._id)
    await write.delete(aboutRedesign._id)
    console.log('Deleted home-redesign and about-redesign documents')
  } else {
    console.log('Stubs kept. Re-run with --delete-stubs after code retarget.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
