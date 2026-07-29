/**
 * Studio access roles — email allowlists for translator / super-admin UX gates.
 * Fill in real addresses before relying on role-based Studio behavior.
 */

export const TRANSLATOR_EMAILS: string[] = [
  'karen@vantage.pictures', 'hien@vantage.pictures'
]

/** Super-admin (full Studio tools + permanent delete). */
export const ADMIN_EMAIL = 'zglorenz@gmail.com' // e.g. 'admin@example.com'

export type StudioRole = 'admin' | 'editor' | 'translator'

export function getStudioRole(
  currentUser: {email?: string} | null | undefined,
): StudioRole {
  const email = currentUser?.email?.toLowerCase()
  if (email && email === ADMIN_EMAIL.toLowerCase()) return 'admin'
  if (email && TRANSLATOR_EMAILS.some((e) => e.toLowerCase() === email)) return 'translator'
  return 'editor'
}
