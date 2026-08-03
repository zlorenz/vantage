/**
 * Percent-encode redirect source/destination for Next.js `redirects()`.
 *
 * Next compares rule sources against the percent-encoded request path
 * (vercel/next.js#33470). Raw Unicode sources never match at runtime.
 *
 * IMPORTANT: Pass raw Unicode/ASCII path strings only. Do NOT pre-encode —
 * running encodeURI on an already-percent-encoded string double-encodes
 * `%` → `%25` (related failure mode: vercel/next.js#17308).
 *
 * `encodeURI` leaves `/` and route param placeholders (`:slug`, `:path*`)
 * intact.
 */

export type RedirectRule = {
  source: string
  destination: string
  permanent?: boolean
}

function assertRawPath(path: string, field: 'source' | 'destination'): void {
  if (/%[0-9A-Fa-f]{2}/.test(path)) {
    throw new Error(
      `encodeRedirectRule: ${field} looks pre-encoded (contains %XX); ` +
        `pass raw Unicode only to avoid double-encoding: ${path}`,
    )
  }
}

export function encodeRedirectPath(path: string): string {
  return encodeURI(path)
}

export function encodeRedirectRule<T extends RedirectRule>(rule: T): T {
  assertRawPath(rule.source, 'source')
  assertRawPath(rule.destination, 'destination')
  return {
    ...rule,
    source: encodeRedirectPath(rule.source),
    destination: encodeRedirectPath(rule.destination),
  }
}
