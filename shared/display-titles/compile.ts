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

/**
 * Yellow brand/product line over the white campaign line.
 * Same split as the work-internal list: with a campaign, the top line is the
 * deduped brand + product; otherwise the top line is the brand and the line
 * under it is the product. Returns null when the two lines would repeat
 * (brand-only stays a single title).
 */
export function documentTitleLines(
  parts:
    | Pick<DisplayTitleParts, 'brandName' | 'productName' | 'campaignTitle'>
    | null
    | undefined,
): {brandLine: string; campaignLine: string} | null {
  if (!parts) return null
  const brand = trimPart(parts.brandName)
  if (!brand) return null
  const product = trimPart(parts.productName)
  const campaign = trimPart(parts.campaignTitle)
  const brandLine = campaign ? dedupedBrandProduct(brand, product) : brand
  const campaignLine = campaign || product || brand
  if (!brandLine || brandLine.toLowerCase() === campaignLine.toLowerCase()) return null
  return {brandLine, campaignLine}
}

export function dedupedBrandProduct(
  brand: string | null | undefined,
  product: string | null | undefined,
): string {
  const b = trimPart(brand)
  const p = trimPart(product)
  if (!b) return p
  if (!p) return b
  const firstWord = p.split(/\s+/)[0]
  if (firstWord.toLowerCase() === b.toLowerCase()) {
    return p
  }
  return joinParts(b, p)
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
 * - Header: Brand solid + outlined (Campaign, else Product) — never includes heroFilmTitle
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
  // Prefer campaign for header (matches longTitle + live site); fall back to product.
  const headerSecondary = campaign || product
  const thumbSecondary = thumbSecondLine(product, campaign)

  const dedupedBrandProductStr = dedupedBrandProduct(brand, product)

  let longTitle = brand
  if (hero) {
    // Multi-video: series name stays solid; first-film episode is outlined.
    const solid = joinParts(dedupedBrandProductStr, campaign) || brand
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

  let documentTitle = dedupedBrandProductStr || brand
  if (campaign) {
    const head = dedupedBrandProductStr || brand
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
