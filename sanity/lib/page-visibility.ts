/**
 * Page-document visibility helpers — show Studio fields only on the pages that use them.
 */

type SlugValue = {current?: string | null} | string | null | undefined

/**
 * Page slugs that must not appear in Studio (Content table, structure lists).
 * These routes are code-owned (e.g. /work-internal) and not edited as CMS pages.
 */
export const STUDIO_HIDDEN_PAGE_SLUGS = ['work-internal'] as const

/** GROQ fragment: exclude code-owned pages from Studio page lists. */
export const STUDIO_PAGE_LIST_GROQ_FILTER = `!(slug.current in ${JSON.stringify(
  [...STUDIO_HIDDEN_PAGE_SLUGS],
)})`

function slugCurrent(slug: SlugValue): string | undefined {
  if (typeof slug === 'string') {
    const trimmed = slug.trim()
    return trimmed || undefined
  }
  if (slug && typeof slug === 'object' && typeof slug.current === 'string') {
    const trimmed = slug.current.trim()
    return trimmed || undefined
  }
  return undefined
}

/** English slug from a page document (`slug.current`). */
export function pageSlug(
  document?: Record<string, unknown> | null,
): string | undefined {
  return slugCurrent(document?.slug as SlugValue)
}

export function isStudioHiddenPageSlug(
  slug: string | undefined | null,
): boolean {
  return Boolean(
    slug &&
      (STUDIO_HIDDEN_PAGE_SLUGS as readonly string[]).includes(slug),
  )
}

export function isPageSlug(
  document: Record<string, unknown> | null | undefined,
  slug: string | readonly string[],
): boolean {
  const current = pageSlug(document)
  if (!current) return false
  return typeof slug === 'string' ? current === slug : slug.includes(current)
}

/**
 * Sanity `hidden` callback — hide unless the page slug matches.
 * When slug is empty (new draft), page-specific fields stay hidden.
 */
export function hideUnlessPageSlug(slug: string | readonly string[]) {
  return ({document}: {document?: Record<string, unknown> | undefined}) =>
    !isPageSlug(document, slug)
}

/** Sanity group `hidden` — same slug gate (groups pass `value` as the document). */
export function hideGroupUnlessPageSlug(slug: string | readonly string[]) {
  return ({
    document,
    value,
  }: {
    document?: Record<string, unknown> | undefined
    value?: Record<string, unknown> | undefined
  }) => !isPageSlug(document ?? value, slug)
}
