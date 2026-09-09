/**
 * Opaque showreel document IDs.
 *
 * Format: sr_ + 22 hex chars from UUID (same style as creditIdentityId).
 * Used as Sanity `_id` and as the public/edit URL `[id]` segment.
 */

export function showreelId(): string {
  const hex =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}pad`
  return `sr_${hex.slice(0, 22)}`
}
