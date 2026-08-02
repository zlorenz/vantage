/**
 * Build absolute front-end URLs for CMS documents (English by default).
 *
 * Mirrors Next.js routes in src/i18n/routing.ts and src/lib/nav-paths.ts.
 */

type Locale = 'en' | 'zh'

type SlugField = {current?: string} | string | undefined | null

export type FrontEndDocument = {
  slug?: SlugField
  slugZh?: SlugField
}

const DEFAULT_SITE_URL = 'https://vantage.pictures'

/** CMS types that map to a public page on the Next.js site. */
export const FRONT_END_DOCUMENT_TYPES = new Set([
  'portfolioEntry',
  'blogPost',
  'page',
  'videoFormat',
  'industry',
  'market',
  'category',
])

/** EN/ZH paths for CMS `page` slugs — single source of truth for Studio + sitemap. */
export const PAGE_ROUTES: Record<string, {en: string; zh: string}> = {
  home: {en: '/', zh: '/zh/'},
  work: {en: '/work/', zh: '/zh/工作/'},
  'work-internal': {en: '/work-internal/', zh: '/zh/work-internal/'},
  search: {en: '/search/', zh: '/zh/search/'},
  about: {en: '/about/', zh: '/zh/关于/'},
  news: {en: '/news/', zh: '/zh/新闻/'},
  contact: {en: '/contact/', zh: '/zh/联系/'},
  'vietnam-production-service': {
    en: '/vietnam-production-service/',
    zh: '/zh/越南生产服务/',
  },
  'vietnam-location-guide': {
    en: '/vietnam-location-guide/',
    zh: '/zh/越南旅游指南/',
  },
  'video-campaign-brief': {
    en: '/video-campaign-brief/',
    zh: '/zh/视频活动简介/',
  },
}

const TAXONOMY_PREFIX: Record<
  'videoFormat' | 'industry' | 'market' | 'category',
  {en: string; zh: string}
> = {
  videoFormat: {en: '/video-format/', zh: '/zh/视频格式/'},
  industry: {en: '/industry/', zh: '/zh/产业/'},
  market: {en: '/market/', zh: '/zh/市场/'},
  category: {en: '/category/', zh: '/zh/类别/'},
}

function readSlug(value: SlugField): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  const current = value.current?.trim()
  return current || undefined
}

/** Site origin for preview links. Override with SANITY_STUDIO_SITE_URL. */
export function getSiteBaseUrl(): string {
  const env = (import.meta as ImportMeta & {env?: Record<string, string | boolean>}).env
  const fromEnv = env?.SANITY_STUDIO_SITE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '')
  }
  if (env?.DEV) {
    return 'http://localhost:3000'
  }
  return DEFAULT_SITE_URL
}

function joinSiteUrl(baseUrl: string, path: string): string {
  if (path === '/') return `${baseUrl}/`
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

function pathForDocument(
  documentType: string,
  document: FrontEndDocument,
  locale: Locale,
): string | undefined {
  const slug = readSlug(document.slug)
  const slugZh = readSlug(document.slugZh)
  const localizedSlug = locale === 'zh' ? slugZh || slug : slug

  if (!localizedSlug && documentType !== 'page') {
    return undefined
  }

  switch (documentType) {
    case 'portfolioEntry':
      return locale === 'zh'
        ? `/zh/投资组合/${localizedSlug}/`
        : `/portfolio/${localizedSlug}/`

    case 'blogPost':
      return locale === 'zh' ? `/zh/${localizedSlug}/` : `/${localizedSlug}/`

    case 'page': {
      if (!slug) return undefined
      const mapped = PAGE_ROUTES[slug]
      if (mapped) return mapped[locale]
      return locale === 'zh' ? `/zh/${slugZh || slug}/` : `/${slug}/`
    }

    case 'videoFormat':
    case 'industry':
    case 'market':
    case 'category': {
      const prefix = TAXONOMY_PREFIX[documentType]
      return `${prefix[locale]}${localizedSlug}/`
    }

    default:
      return undefined
  }
}

export function getFrontEndUrl(
  documentType: string,
  document: FrontEndDocument | null | undefined,
  options?: {locale?: Locale; baseUrl?: string},
): string | undefined {
  if (!document || !FRONT_END_DOCUMENT_TYPES.has(documentType)) {
    return undefined
  }

  const locale = options?.locale ?? 'en'
  const path = pathForDocument(documentType, document, locale)
  if (!path) return undefined

  return joinSiteUrl(options?.baseUrl ?? getSiteBaseUrl(), path)
}

export function mergeDocumentSnapshot(
  published?: FrontEndDocument | null,
  draft?: FrontEndDocument | null,
): FrontEndDocument | undefined {
  if (!published && !draft) return undefined
  return {...published, ...draft}
}
