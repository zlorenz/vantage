/**
 * Normalize WordPress migration URLs to internal app paths.
 */

export function normalizeInternalPath(url: string): string {
  const decoded = url.replace(/&amp;/g, '&').trim();
  if (!decoded) return '/';

  if (decoded.startsWith('/')) {
    return decoded.replace(/\/$/, '') || '/';
  }

  try {
    const parsed = new URL(decoded);
    return parsed.pathname.replace(/\/$/, '') || '/';
  } catch {
    return decoded;
  }
}
