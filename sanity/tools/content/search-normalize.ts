/**
 * Studio Content-table search normalization only.
 *
 * Intentionally separate from shared `normalizeCreditToken` / `normName`
 * used by identity-linking. Those must NOT fold Vietnamese Đ/đ → d
 * (would change linking equality). Search needs that fold so queries
 * like "Cam Dg" match rows titled "Cam Đg".
 */

/** Fold Vietnamese Đ/đ (U+0110 / U+0111) to ASCII d before accent strip. */
function foldVietnameseDStroke(value: string): string {
  return value.replace(/\u0110/g, 'D').replace(/\u0111/g, 'd')
}

/**
 * Search-only normalize: Đ→d, then NFKD + strip combining marks + lowercase
 * + collapse non-alphanumerics (same shape as normalizeCreditToken, but
 * with the Đ fold the shared linking helper deliberately omits).
 */
export function normalizeSearchText(value: string): string {
  return foldVietnameseDStroke(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** True when haystack contains needle under search-only normalization. */
export function searchTextIncludes(haystack: string, needle: string): boolean {
  const q = normalizeSearchText(needle)
  if (!q) return true
  return normalizeSearchText(haystack).includes(q)
}
