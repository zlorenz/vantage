/**
 * Persist a create-showreel intent across the login redirect round-trip.
 * Selection state is otherwise in-memory only (by design).
 */

const STORAGE_KEY = 'vp_work_internal_showreel_create'
const MAX_AGE_MS = 30 * 60 * 1000

type PendingPayload = {
  ids: string[]
  at: number
}

export function stashShowreelCreatePending(ids: string[]): void {
  if (typeof window === 'undefined' || ids.length === 0) return
  const payload: PendingPayload = {ids: [...ids], at: Date.now()}
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota / private mode — login redirect still works; user reselects.
  }
}

/** Read and clear a pending create intent. Returns null if missing/stale. */
export function takeShowreelCreatePending(): string[] | null {
  if (typeof window === 'undefined') return null
  let raw: string | null
  try {
    raw = sessionStorage.getItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingPayload
    if (!Array.isArray(parsed.ids) || parsed.ids.length === 0) return null
    if (
      typeof parsed.at !== 'number' ||
      Date.now() - parsed.at > MAX_AGE_MS
    ) {
      return null
    }
    const ids = parsed.ids.filter(
      (id): id is string => typeof id === 'string' && id.trim().length > 0,
    )
    return ids.length > 0 ? ids : null
  } catch {
    return null
  }
}
