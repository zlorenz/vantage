import {createClient} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
if (!dataset) throw new Error('Missing NEXT_PUBLIC_SANITY_DATASET')

const studioUrl =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'https://vantage.sanity.studio'

/**
 * Visual-editing client (next-sanity). SEPARATE from the legacy read client in
 * src/lib/sanity.ts. Only ever use this via sanityFetch (live.ts) or the draft-mode
 * routes. Never call .fetch() on it directly in a published render path — stega
 * characters can leak into production HTML. sanityFetch gates stega to Draft Mode.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-02-01',
  useCdn: true,
  stega: {studioUrl},
})
