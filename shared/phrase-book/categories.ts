/**
 * Translator-facing phrase categories for the master Translations tool.
 */

export type PhraseCategoryId =
  | 'companies'
  | 'crew-roles'
  | 'campaigns'
  | 'work-filters'
  | 'pages-news'
  | 'document-titles'
  | 'descriptions'
  | 'interface'

export type PhraseCategoryDef = {
  id: PhraseCategoryId
  title: string
}

/** Display order for filter chips. */
export const PHRASE_CATEGORIES: PhraseCategoryDef[] = [
  {id: 'companies', title: 'Companies'},
  {id: 'crew-roles', title: 'Crew roles'},
  {id: 'campaigns', title: 'Campaigns & films'},
  {id: 'work-filters', title: 'Work filters'},
  {id: 'pages-news', title: 'Pages & news'},
  {id: 'document-titles', title: 'Document titles'},
  {id: 'descriptions', title: 'Descriptions'},
  {id: 'interface', title: 'Interface'},
]

/** Primary-category priority when one EN hits multiple sources. */
export const PHRASE_CATEGORY_PRIORITY: PhraseCategoryId[] = [
  'companies',
  'crew-roles',
  'campaigns',
  'work-filters',
  'pages-news',
  'document-titles',
  'descriptions',
  'interface',
]

const PRIORITY_RANK = new Map(
  PHRASE_CATEGORY_PRIORITY.map((id, index) => [id, index]),
)

export function preferCategory(
  a: PhraseCategoryId,
  b: PhraseCategoryId,
): PhraseCategoryId {
  const ra = PRIORITY_RANK.get(a) ?? 999
  const rb = PRIORITY_RANK.get(b) ?? 999
  return ra <= rb ? a : b
}

/** Crew role keys whose *people names* are company vendors (not humans). */
export const COMPANY_CREW_ROLE_KEYS = new Set([
  'brand',
  'agency',
  'production_company',
  'production_service',
])

const COMPANY_CREW_ROLE_LABELS = new Set([
  'brand',
  'agency',
  'agencies',
  'production company',
  'production companies',
  'production service',
  'production services',
])

/** True when a credit row is Brand / Agency / Production Company / Production Service. */
export function isCompanyCrewRole(
  roleKey?: string | null,
  roleLabel?: string | null,
): boolean {
  if (roleKey && COMPANY_CREW_ROLE_KEYS.has(roleKey)) return true
  const label = (roleLabel ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
  return Boolean(label && COMPANY_CREW_ROLE_LABELS.has(label))
}

/**
 * Map a CMS plain field path (+ document type) to a phrase category.
 */
export function categoryForCmsField(
  documentType: string,
  enPath: string,
): PhraseCategoryId {
  // Display-title brand field = client/company name (same bucket as crew Brand role).
  if (enPath === 'displayTitleParts.brandName') return 'companies'

  if (
    enPath === 'crewCredits[].people.name' ||
    enPath.endsWith('.people.name')
  ) {
    return 'companies'
  }

  if (
    enPath === 'displayTitleParts.productName' ||
    enPath === 'displayTitleParts.campaignTitle' ||
    enPath === 'heroFilmTitle' ||
    enPath === 'additionalVideos[].videoTitle' ||
    enPath.endsWith('.videoTitle')
  ) {
    return 'campaigns'
  }

  if (
    documentType === 'industry' ||
    documentType === 'market' ||
    documentType === 'videoFormat'
  ) {
    if (enPath === 'title') return 'work-filters'
    if (enPath === 'description') return 'descriptions'
  }

  if (documentType === 'category' && enPath === 'title') return 'pages-news'

  if (
    enPath === 'contactModalTitle' ||
    enPath === 'contactModalIntro' ||
    enPath === 'contactAddress' ||
    enPath === 'contactCtaText' ||
    enPath === 'campaignCta.buttonLabel' ||
    enPath.endsWith('.buttonLabel')
  ) {
    return 'interface'
  }

  if (
    (documentType === 'page' || documentType === 'blogPost') &&
    enPath === 'title'
  ) {
    return 'pages-news'
  }

  if (enPath === 'founders[].jobTitle' || enPath.endsWith('.jobTitle')) {
    return 'pages-news'
  }

  if (documentType === 'portfolioEntry' && enPath === 'title') {
    return 'document-titles'
  }

  if (
    enPath === 'excerpt' ||
    enPath === 'description' ||
    enPath === 'additionalVideos[].description' ||
    enPath.endsWith('.description') ||
    enPath === 'seo.metaDescription'
  ) {
    return 'descriptions'
  }

  return 'descriptions'
}
