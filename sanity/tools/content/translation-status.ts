/**
 * Glanceable EN→ZH completeness for Studio content tables.
 *
 * A field counts only when its English value is non-empty. Critical fields are
 * copy a visitor sees on load. Secondary fields are SEO, URL slugs, and copy
 * behind an info button or the contact modal.
 *
 * Portable Text is a presence check (the list query projects booleans). A
 * shorter but real Chinese body still counts as translated.
 */

export type TranslationTier = 'critical' | 'secondary'

export type TranslationLevel = 'green' | 'yellow' | 'red'

export type TranslationGap = {
  tier: TranslationTier
  label: string
}

export type TranslationStatus = {
  level: TranslationLevel
  missing: TranslationGap[]
}

export type TranslationFilter = 'all' | TranslationLevel

export const TRANSLATION_FILTERS: ReadonlyArray<{
  id: TranslationFilter
  label: string
}> = [
  {id: 'all', label: 'All'},
  {id: 'red', label: 'Critical missing'},
  {id: 'yellow', label: 'Secondary missing'},
  {id: 'green', label: 'Complete'},
]

/** Red first, then yellow, then green. Rows with no status sort last. */
export function translationSortRank(
  level: TranslationLevel | null | undefined,
): number {
  if (level === 'red') return 0
  if (level === 'yellow') return 1
  if (level === 'green') return 2
  return 3
}

type Loose = Record<string, unknown>

function isRecord(value: unknown): value is Loose {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asRecords(value: unknown): Loose[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord)
}

/**
 * GROQ expression: true when a portable-text array has visitor-facing text.
 * `pt::text` covers blocks; pull quotes, button labels, and image alt/caption
 * live outside those blocks and are included so a body made only of them
 * still counts.
 */
export function portableTextHasText(field: string): string {
  return `(
    length(pt::text(${field})) > 0
    || count(${field}[_type == "pullQuote" && length(coalesce(text, "")) > 0]) > 0
    || count(${field}[_type == "ctaButton" && length(coalesce(label, "")) > 0]) > 0
    || count(${field}[_type == "image" && (length(coalesce(alt, "")) > 0 || length(coalesce(caption, "")) > 0)]) > 0
    || count(${field}[_type == "imageGallery"].images[length(coalesce(alt, "")) > 0 || length(coalesce(caption, "")) > 0]) > 0
    || count(${field}[_type == "imagePair" && (
      length(coalesce(left.alt, "")) > 0
      || length(coalesce(left.caption, "")) > 0
      || length(coalesce(right.alt, "")) > 0
      || length(coalesce(right.caption, "")) > 0
    )]) > 0
  )`
}

function consider(
  gaps: TranslationGap[],
  tier: TranslationTier,
  label: string,
  en: unknown,
  zh: unknown,
): boolean {
  if (!text(en)) return false
  if (!text(zh)) gaps.push({tier, label})
  return true
}

function considerPresence(
  gaps: TranslationGap[],
  tier: TranslationTier,
  label: string,
  enHasText: unknown,
  zhHasText: unknown,
): boolean {
  if (enHasText !== true) return false
  if (zhHasText !== true) gaps.push({tier, label})
  return true
}

function considerParagraphs(
  gaps: TranslationGap[],
  tier: TranslationTier,
  label: string,
  en: unknown,
  zh: unknown,
): boolean {
  if (!Array.isArray(en)) return false
  const zhItems = Array.isArray(zh) ? zh : []
  let applicable = false
  let missing = false
  en.forEach((item, index) => {
    if (!text(item)) return
    applicable = true
    if (!text(zhItems[index])) missing = true
  })
  if (missing) gaps.push({tier, label})
  return applicable
}

function considerSeo(gaps: TranslationGap[], doc: Loose): number {
  let applicable = 0
  if (consider(gaps, 'secondary', 'Meta title', doc.metaTitle, doc.metaTitleZh)) {
    applicable += 1
  }
  if (
    consider(
      gaps,
      'secondary',
      'Meta description',
      doc.metaDescription,
      doc.metaDescriptionZh,
    )
  ) {
    applicable += 1
  }
  return applicable
}

function considerSlug(gaps: TranslationGap[], doc: Loose): number {
  return consider(gaps, 'secondary', 'Slug', doc.slug, doc.slugZh) ? 1 : 0
}

function considerVideos(
  gaps: TranslationGap[],
  rows: Loose[],
  descriptions: boolean,
): number {
  let applicable = 0
  rows.forEach((row, index) => {
    const n = index + 1
    if (
      consider(gaps, 'critical', `Video ${n} title`, row.videoTitle, row.videoTitleZh)
    ) {
      applicable += 1
    }
    if (
      descriptions &&
      consider(
        gaps,
        'secondary',
        `Video ${n} description`,
        row.description,
        row.descriptionZh,
      )
    ) {
      applicable += 1
    }
  })
  return applicable
}

function portfolioStatus(doc: Loose, gaps: TranslationGap[]): number {
  let applicable = 0
  const parts = isRecord(doc.displayTitleParts) ? doc.displayTitleParts : {}
  if (consider(gaps, 'critical', 'Brand name', parts.brandName, parts.brandNameZh)) {
    applicable += 1
  }
  if (
    consider(gaps, 'critical', 'Product name', parts.productName, parts.productNameZh)
  ) {
    applicable += 1
  }
  if (
    consider(
      gaps,
      'critical',
      'Campaign title',
      parts.campaignTitle,
      parts.campaignTitleZh,
    )
  ) {
    applicable += 1
  }
  if (
    consider(
      gaps,
      'critical',
      'Thumbnail title',
      doc.thumbTitleOverride,
      doc.thumbTitleOverrideZh,
    )
  ) {
    applicable += 1
  }
  if (
    consider(
      gaps,
      'critical',
      'Header title',
      doc.headerTitleOverride,
      doc.headerTitleOverrideZh,
    )
  ) {
    applicable += 1
  }
  if (
    consider(
      gaps,
      'critical',
      'Full title',
      doc.longTitleOverride,
      doc.longTitleOverrideZh,
    )
  ) {
    applicable += 1
  }

  const videos = asRecords(doc.videos)
  if (videos.length > 0) {
    applicable += considerVideos(gaps, videos, true)
  } else {
    if (
      consider(gaps, 'critical', 'Hero film title', doc.heroFilmTitle, doc.heroFilmTitleZh)
    ) {
      applicable += 1
    }
    applicable += considerVideos(gaps, asRecords(doc.additionalVideos), true)
  }

  if (consider(gaps, 'secondary', 'Logline', doc.excerpt, doc.excerptZh)) {
    applicable += 1
  }
  if (consider(gaps, 'secondary', 'Description', doc.description, doc.descriptionZh)) {
    applicable += 1
  }
  applicable += considerSeo(gaps, doc)
  applicable += considerSlug(gaps, doc)
  return applicable
}

function blogStatus(doc: Loose, gaps: TranslationGap[]): number {
  let applicable = 0
  if (consider(gaps, 'critical', 'Title', doc.title, doc.titleZh)) applicable += 1
  if (consider(gaps, 'critical', 'Excerpt', doc.excerpt, doc.excerptZh)) applicable += 1
  if (considerPresence(gaps, 'critical', 'Body', doc.bodyHasText, doc.bodyZhHasText)) {
    applicable += 1
  }
  applicable += considerSeo(gaps, doc)
  applicable += considerSlug(gaps, doc)
  return applicable
}

function pageStatus(doc: Loose, gaps: TranslationGap[]): number {
  // Title, excerpt, body, SEO, and slug match posts. Pages add nav, hero, and arrays.
  let applicable = blogStatus(doc, gaps)
  if (consider(gaps, 'critical', 'Nav label', doc.navLabel, doc.navLabelZh)) {
    applicable += 1
  }

  asRecords(doc.founders).forEach((founder, index) => {
    const who = text(founder.name) || `Founder ${index + 1}`
    if (
      consider(gaps, 'critical', `Job title (${who})`, founder.jobTitle, founder.jobTitleZh)
    ) {
      applicable += 1
    }
    if (
      consider(
        gaps,
        'secondary',
        `Professional title (${who})`,
        founder.professionalTitle,
        founder.professionalTitleZh,
      )
    ) {
      applicable += 1
    }
    if (consider(gaps, 'secondary', `Bio (${who})`, founder.bio, founder.bioZh)) {
      applicable += 1
    }
  })

  asRecords(doc.awardItems).forEach((award, index) => {
    const who = text(award.title) || `Award ${index + 1}`
    if (consider(gaps, 'critical', `Award title (${who})`, award.title, award.titleZh)) {
      applicable += 1
    }
    if (
      consider(gaps, 'critical', `Award category (${who})`, award.category, award.categoryZh)
    ) {
      applicable += 1
    }
  })

  return applicable
}

function taxonomyStatus(doc: Loose, gaps: TranslationGap[], withDescription: boolean): number {
  let applicable = 0
  if (consider(gaps, 'critical', 'Title', doc.title, doc.titleZh)) applicable += 1
  if (
    withDescription &&
    consider(gaps, 'critical', 'Description', doc.description, doc.descriptionZh)
  ) {
    applicable += 1
  }
  applicable += considerSlug(gaps, doc)
  return applicable
}

function siteSettingsStatus(doc: Loose, gaps: TranslationGap[]): number {
  let applicable = 0
  const cta = isRecord(doc.campaignCta) ? doc.campaignCta : {}
  if (consider(gaps, 'critical', 'CTA heading', cta.heading, cta.headingZh)) {
    applicable += 1
  }
  if (
    considerParagraphs(gaps, 'critical', 'CTA paragraphs', cta.paragraphs, cta.paragraphsZh)
  ) {
    applicable += 1
  }
  if (consider(gaps, 'critical', 'CTA button', cta.buttonLabel, cta.buttonLabelZh)) {
    applicable += 1
  }
  if (
    consider(gaps, 'secondary', 'Contact address', doc.contactAddress, doc.contactAddressZh)
  ) {
    applicable += 1
  }
  if (
    consider(
      gaps,
      'secondary',
      'Contact modal title',
      doc.contactModalTitle,
      doc.contactModalTitleZh,
    )
  ) {
    applicable += 1
  }
  if (
    consider(
      gaps,
      'secondary',
      'Contact modal intro',
      doc.contactModalIntro,
      doc.contactModalIntroZh,
    )
  ) {
    applicable += 1
  }
  if (
    consider(gaps, 'secondary', 'Contact button', doc.contactCtaText, doc.contactCtaTextZh)
  ) {
    applicable += 1
  }
  if (
    considerPresence(
      gaps,
      'secondary',
      'Contact modal body',
      doc.contactModalHasText,
      doc.contactModalZhHasText,
    )
  ) {
    applicable += 1
  }
  return applicable
}

function finalize(applicable: number, gaps: TranslationGap[]): TranslationStatus | null {
  if (applicable === 0) return null
  const level: TranslationLevel = gaps.some((gap) => gap.tier === 'critical')
    ? 'red'
    : gaps.length > 0
      ? 'yellow'
      : 'green'
  return {level, missing: gaps}
}

/**
 * Status for one list row. Returns null for document types that are not
 * translation work (crew names, platforms) and for empty drafts with no
 * English copy to translate.
 */
export function translationStatus(doc: Loose): TranslationStatus | null {
  const gaps: TranslationGap[] = []
  const type = typeof doc._type === 'string' ? doc._type : ''
  let applicable = 0

  switch (type) {
    case 'portfolioEntry':
      applicable = portfolioStatus(doc, gaps)
      break
    case 'blogPost':
      applicable = blogStatus(doc, gaps)
      break
    case 'page':
      applicable = pageStatus(doc, gaps)
      break
    case 'industry':
    case 'market':
    case 'videoFormat':
      applicable = taxonomyStatus(doc, gaps, true)
      break
    case 'category':
      applicable = taxonomyStatus(doc, gaps, false)
      break
    case 'siteSettings':
      applicable = siteSettingsStatus(doc, gaps)
      break
    default:
      return null
  }

  return finalize(applicable, gaps)
}

export function translationAriaLabel(status: TranslationStatus): string {
  const names = status.missing.map((gap) => gap.label).join(', ')
  if (status.level === 'green') return 'All fields translated'
  if (status.level === 'red') {
    return names
      ? `Critical fields need translation: ${names}`
      : 'Critical fields need translation'
  }
  return names
    ? `Secondary fields need translation: ${names}`
    : 'Secondary fields need translation'
}
