/**
 * Server-side phrase book fetch (exact EN→ZH map).
 */

import {cache} from 'react'

import {
  buildPhraseMap,
  phraseMapToRecord,
  type PhraseMap,
  type PhraseRow,
} from '@phrase-book'

import {sanityClient} from '@/lib/sanity'

export const PHRASE_BOOK_QUERY = `*[_type == "translatedPhrase"]{en, zh}`

async function loadPhraseMap(): Promise<PhraseMap> {
  const rows = await sanityClient.fetch<PhraseRow[]>(PHRASE_BOOK_QUERY)
  return buildPhraseMap(rows)
}

/** Deduped per request — safe to call from multiple server components. */
export const getPhraseMap = cache(loadPhraseMap)

/** Serializable map for client components (PortfolioGrid, HeroCarousel). */
export async function getPhraseRecord(): Promise<Record<string, string>> {
  return phraseMapToRecord(await getPhraseMap())
}
