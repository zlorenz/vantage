import {
  DOCUMENT_TITLE_DASH,
  type CompiledDisplayTitles,
  type DisplayTitleParts,
} from './types'

export function trimPart(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

export function joinParts(...parts: Array<string | null | undefined>): string {
  return parts
    .map(trimPart)
    .filter(Boolean)
    .join(' ')
}

function outlineSpan(text: string): string {
  return `<span class="vp-outline"> ${trimPart(text)} </span>`
}

/**
 * Max length for the thumbnail secondary segment (product or campaign).
 * Longer text crowds card imagery — fall back to brand-only.
 * Calibrated against live /work overlays (typical ≤18; crowded examples ≥20).
 */
export const THUMB_SECOND_LINE_MAX = 18

/**
 * Pick thumbnail secondary text: prefer product, else campaign, only when short enough.
 */
export function thumbSecondLine(
  product: string,
  campaign: string,
  maxLength: number = THUMB_SECOND_LINE_MAX,
): string {
  if (product && product.length <= maxLength) return product
  if (campaign && campaign.length <= maxLength) return campaign
  return ''
}

/**
 * Compile Brand / Product / Campaign [/ Hero Film] into thumb, header, full, and document titles.
 *
 * Rules:
 * - Full: Brand+Product solid + outlined Campaign; if no campaign, Brand solid + outlined Product
 *   When heroFilmTitle is set (multi-video): Brand+Product+Campaign solid + outlined hero episode
 * - Header: Brand solid + outlined (Product, else Campaign) — never includes heroFilmTitle
 * - Thumb: single-line `Brand Secondary` (product else short campaign); brand-only if secondary too long
 * - Document: `Brand Product – Campaign` (en-dash); hero episode is not part of the document title
 */
export function compileDisplayTitles(
  parts: DisplayTitleParts,
): CompiledDisplayTitles {
  const brand = trimPart(parts.brandName)
  const product = trimPart(parts.productName)
  const campaign = trimPart(parts.campaignTitle)
  const hero = trimPart(parts.heroFilmTitle)

  const brandProduct = joinParts(brand, product)
  // Same preference as thumb (product, else campaign) — unlimited length for header.
  const headerSecondary = product || campaign
  const thumbSecondary = thumbSecondLine(product, campaign)

  let longTitle = brand
  if (hero) {
    // Multi-video: series name stays solid; first-film episode is outlined.
    const solid = joinParts(brand, product, campaign) || brand
    longTitle = `${solid}${outlineSpan(hero)}`
  } else if (campaign) {
    longTitle = `${brandProduct}${outlineSpan(campaign)}`
  } else if (product) {
    longTitle = `${brand}${outlineSpan(product)}`
  }

  let headerTitle = brand
  if (headerSecondary) {
    headerTitle = `${brand}${outlineSpan(headerSecondary)}`
  }

  const thumbTitle = thumbSecondary
    ? joinParts(brand, thumbSecondary)
    : brand

  let documentTitle = brandProduct || brand
  if (campaign) {
    const head = brandProduct || brand
    documentTitle = head
      ? `${head} ${DOCUMENT_TITLE_DASH} ${campaign}`
      : campaign
  }

  return {
    thumbTitle,
    headerTitle,
    longTitle,
    documentTitle,
  }
}

/** True when at least brand is present (enough to compile). */
export function hasDisplayTitleParts(parts: DisplayTitleParts): boolean {
  return Boolean(trimPart(parts.brandName))
}
