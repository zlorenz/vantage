/**
 * Studio access roles — email allowlists for translator / super-admin UX gates.
 * Fill in real addresses before relying on role-based Studio behavior.
 */

export const TRANSLATOR_EMAILS: string[] = [
  'karen@vantage.pictures', 'hien@vantage.pictures'
  // 'zglorenz@gmail.com'
]

/** Super-admin (full Studio tools + permanent delete). */
// export const ADMIN_EMAIL = 'zglorenz@gmail.com'
export const ADMIN_EMAIL = 'noname@blah.com'

export type StudioRole = 'admin' | 'editor' | 'translator'

export function getStudioRole(
  currentUser: {email?: string} | null | undefined,
): StudioRole {
  const email = currentUser?.email?.toLowerCase()
  if (email && email === ADMIN_EMAIL.toLowerCase()) return 'admin'
  if (email && TRANSLATOR_EMAILS.some((e) => e.toLowerCase() === email)) return 'translator'
  return 'editor'
}

type RoleGateContext = {
  currentUser?: {email?: string} | null
}

/**
 * Sanity schema `hidden` callback: hide the field for translator users.
 * Same ConditionalProperty shape as readOnly (currentUser is available).
 * Compose with other hidden predicates via `||` when wiring schemas.
 */
export function hiddenForTranslator({currentUser}: RoleGateContext): boolean {
  return getStudioRole(currentUser) === 'translator'
}

/**
 * Sanity schema `readOnly` callback: lock the field for translator users
 * (visible context, not editable). Same check as hiddenForTranslator.
 */
export function readOnlyForTranslator({currentUser}: RoleGateContext): boolean {
  return getStudioRole(currentUser) === 'translator'
}
