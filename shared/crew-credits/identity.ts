/**
 * Opaque creditIdentity document IDs.
 *
 * Format: ci_ + 22 hex chars from UUID (or timestamp fallback).
 * Never derived from name or role.
 */

export function creditIdentityId(): string {
  const hex =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}pad`
  return `ci_${hex.slice(0, 22)}`
}
