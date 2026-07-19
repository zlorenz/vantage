/**
 * Helpers for Unicode (e.g. Chinese) dynamic route segments.
 *
 * Next.js can receive percent-encoded path segments while generateStaticParams
 * emits decoded Unicode — mismatch → 404 in dev. Emit both forms, and always
 * decode before Sanity slug lookups.
 */

/** Decode a path slug if it is percent-encoded; return as-is otherwise. */
export function decodePathSlug(slug: string): string {
  if (!/%[0-9A-Fa-f]{2}/.test(slug)) return slug;
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/**
 * Expand a slug into generateStaticParams variants (raw + encoded when needed).
 */
export function expandSlugParam(slug: string | undefined | null): string[] {
  if (!slug) return [];
  const encoded = encodeURIComponent(slug);
  if (encoded === slug) return [slug];
  return [slug, encoded];
}
