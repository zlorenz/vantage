/**
 * Structured display-title parts (display-only; not crew/filter Brand).
 */

export interface DisplayTitleParts {
  brandName?: string | null
  productName?: string | null
  campaignTitle?: string | null
  /**
   * Optional first-video / hero episode title (multi-video campaigns).
   * Outlines the Full (main column) title only — Header stays Brand + Campaign/Product.
   */
  heroFilmTitle?: string | null
}

export interface DisplayTitlePartsLocalized extends DisplayTitleParts {
  brandNameZh?: string | null
  productNameZh?: string | null
  campaignTitleZh?: string | null
  heroFilmTitleZh?: string | null
}

export interface DisplayTitleOverrides {
  thumbTitleOverride?: string | null
  headerTitleOverride?: string | null
  longTitleOverride?: string | null
  thumbTitleOverrideZh?: string | null
  headerTitleOverrideZh?: string | null
  longTitleOverrideZh?: string | null
}

/** Compiled HTML/plain outputs for one locale. */
export interface CompiledDisplayTitles {
  /** Card overlay plain text (single line; no `<br>`). */
  thumbTitle: string
  /** Hero / carousel HTML (outline on secondary segment). */
  headerTitle: string
  /** Main column HTML (outline on campaign, or product if no campaign). */
  longTitle: string
  /** Document title with en-dash before campaign (SEO / Studio list). */
  documentTitle: string
}

/** En-dash used in document titles (matches legacy WP style). */
export const DOCUMENT_TITLE_DASH = '–'
