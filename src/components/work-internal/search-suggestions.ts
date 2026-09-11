/**
 * Client-side search suggestion index for /work-internal.
 *
 * Phrases are derived once from the loaded library (brand / product /
 * campaign / client / crew). Matching is deferred off the typing path
 * via useDeferredValue in WorkInternalApp — no network round-trip.
 */

import {getStructuredRoleNames} from '@/lib/credits-config';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import type {InternalLibraryEntry} from '@/types/sanity';
import {plainText} from './text';

const DEFAULT_LIMIT = 8;

export type SearchSuggestionPhrase = {
  phrase: string;
  phraseLower: string;
  count: number;
};

export type SearchSuggestionIndex = {
  phrases: SearchSuggestionPhrase[];
};

function addPhrase(
  counts: Map<string, {phrase: string; count: number}>,
  raw: string | null | undefined,
): void {
  const phrase = plainText(raw).trim();
  if (phrase.length < 2) return;
  const key = phrase.toLowerCase();
  const existing = counts.get(key);
  if (existing) {
    existing.count += 1;
    return;
  }
  counts.set(key, {phrase, count: 1});
}

/** Build a deduped phrase index from the full library (call once per entries). */
export function buildSearchSuggestionIndex(
  entries: InternalLibraryEntry[],
): SearchSuggestionIndex {
  const counts = new Map<string, {phrase: string; count: number}>();

  for (const entry of entries) {
    const parts = resolveEntryDisplayTitleParts(entry, 'en');
    addPhrase(counts, parts.brandName);
    addPhrase(counts, parts.productName);
    addPhrase(counts, parts.campaignTitle);

    for (const client of entry.clients ?? []) {
      addPhrase(counts, client.name);
    }

    for (const brand of getStructuredRoleNames(entry.crewCredits, 'brand')) {
      addPhrase(counts, brand);
    }

    for (const credit of entry.crewCredits ?? []) {
      for (const person of credit.people ?? []) {
        addPhrase(counts, person.identityName || person.name);
      }
    }
  }

  const phrases = [...counts.values()]
    .map(({phrase, count}) => ({
      phrase,
      phraseLower: phrase.toLowerCase(),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase));

  return {phrases};
}

/**
 * Ranked suggestions for the current query.
 * Prefix matches first, then substring; frequency breaks ties.
 */
export function getSearchSuggestions(
  index: SearchSuggestionIndex,
  query: string,
  limit = DEFAULT_LIMIT,
): string[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 1) return [];

  const prefix: SearchSuggestionPhrase[] = [];
  const contains: SearchSuggestionPhrase[] = [];

  for (const item of index.phrases) {
    if (item.phraseLower === needle) continue;
    if (item.phraseLower.startsWith(needle)) {
      prefix.push(item);
    } else if (item.phraseLower.includes(needle)) {
      contains.push(item);
    }
  }

  const ranked = [...prefix, ...contains];
  return ranked.slice(0, limit).map((item) => item.phrase);
}
