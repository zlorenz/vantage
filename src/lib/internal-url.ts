/**
 * Normalize WordPress migration URLs to internal app paths.
 */

const WP_SUBDIR_PREFIX = '/vantage-local';

const INTERNAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'vantage.pictures',
  'www.vantage.pictures',
]);

/**
 * Convert absolute WP / production URLs (and `/vantage-local/...` paths) into
 * root-relative Next.js paths used by next-intl Link.
 */
export function normalizeInternalPath(url: string): string {
  const decoded = url.replace(/&amp;/g, '&').trim();
  if (!decoded) return '/';

  let pathname = decoded;
  if (!decoded.startsWith('/')) {
    try {
      pathname = new URL(decoded).pathname;
    } catch {
      return decoded;
    }
  }

  pathname = pathname.replace(/\/$/, '') || '/';

  if (pathname === WP_SUBDIR_PREFIX || pathname.startsWith(`${WP_SUBDIR_PREFIX}/`)) {
    pathname = pathname.slice(WP_SUBDIR_PREFIX.length) || '/';
  }

  return pathname.replace(/\/$/, '') || '/';
}

/** True when the href leaves the Vantage site (keep as plain <a target=_blank>). */
export function isAppExternalUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^(mailto|tel):/i.test(trimmed)) return true;
  if (!/^https?:\/\//i.test(trimmed)) return false;

  try {
    const { hostname } = new URL(trimmed);
    return !INTERNAL_HOSTS.has(hostname);
  } catch {
    return false;
  }
}
