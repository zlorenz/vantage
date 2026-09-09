/**
 * Shared portfolioEntry id parsing + existence checks for showreel APIs.
 */

import {randomUUID} from 'node:crypto'
import {getSanityWriteClient} from '@/lib/sanity-write-client'

export function asTrimmedString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }
  return ''
}

/** Returns null when the value is not a non-empty string array. */
export function parsePortfolioItemIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const ids: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') return null
    const id = item.trim()
    if (!id) return null
    ids.push(id)
  }
  return ids
}

/** Dedupe while preserving first-seen order. */
export function uniquePortfolioItemIds(ids: string[]): string[] {
  return [...new Set(ids)]
}

/** Published, non-trashed portfolioEntry ids that exist in the dataset. */
export async function existingPortfolioEntryIds(
  ids: string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const client = getSanityWriteClient()
  const found = await client.fetch<string[]>(
    `*[_type == "portfolioEntry"
      && _id in $ids
      && !(_id in path("drafts.**"))
      && !defined(trash.trashedAt)
    ]._id`,
    {ids},
  )
  return new Set(found)
}

export function portfolioItemRefsFromIds(ids: string[]) {
  return ids.map((ref) => ({
    _key: randomUUID().replace(/-/g, '').slice(0, 12),
    _type: 'reference' as const,
    _ref: ref,
  }))
}
