/**
 * Build Next.js *internal* pathnames for revalidatePath().
 *
 * next-intl rewrites public URLs (e.g. /zh/工作) to destinations under
 * /[locale]/… (e.g. /zh/work). Next.js docs require revalidatePath to use
 * the destination (route-file) path, not the browser URL — confirmed via
 * production x-matched-path: /en/work, /zh/work (not /zh/工作).
 *
 * Public path builders live in sitemap-urls.ts; PAGE_ROUTES in
 * sanity/tools/content/front-end-url.ts (already imported into Next via
 * sitemap-urls). This module maps webhook payloads → internal destinations.
 */

import {PAGE_ROUTES} from '../../sanity/tools/content/front-end-url'
import {pagePaths} from '@/lib/sitemap-urls'

export type RevalidateWebhookBody = {
  _id?: string
  _type?: string
  slug?: string | null
  slugZh?: string | null
}

/** Internal locale-prefixed path (Next destination after next-intl rewrite). */
function localePath(locale: 'en' | 'zh', pathnameKey: string): string {
  if (!pathnameKey || pathnameKey === '/') {
    return `/${locale}`
  }
  const normalized = pathnameKey.startsWith('/') ? pathnameKey : `/${pathnameKey}`
  return `/${locale}${normalized}`
}

function unique(paths: string[]): string[] {
  return [...new Set(paths.filter(Boolean))]
}

/**
 * Paths to revalidate for a Sanity webhook payload.
 * Always includes /sitemap.xml (src/app/sitemap.ts → /sitemap.xml).
 */
export function pathsForWebhookBody(body: RevalidateWebhookBody): string[] {
  const type = body._type
  const slug = body.slug?.trim() || ''
  const slugZh = body.slugZh?.trim() || ''
  const zhSlug = slugZh || slug

  const sitemap = '/sitemap.xml'
  const home = [localePath('en', '/'), localePath('zh', '/')]
  const work = [localePath('en', '/work'), localePath('zh', '/work')]
  const news = [localePath('en', '/news'), localePath('zh', '/news')]

  if (type === 'portfolioEntry') {
    if (!slug) {
      return unique([...work, ...home, sitemap])
    }
    return unique([
      localePath('en', `/portfolio/${slug}`),
      localePath('zh', `/portfolio/${zhSlug}`),
      ...work,
      ...home,
      sitemap,
    ])
  }

  if (type === 'blogPost') {
    if (!slug) {
      return unique([...news, ...home, sitemap])
    }
    return unique([
      localePath('en', `/${slug}`),
      localePath('zh', `/${zhSlug}`),
      ...news,
      ...home,
      sitemap,
    ])
  }

  if (type === 'page') {
    if (!slug) {
      return unique([sitemap])
    }
    // Prefer PAGE_ROUTES / pagePaths for known CMS pages; fall back like
    // front-end-url.ts pathForDocument (unmapped → /{slug} + /zh/{slugZh||slug}).
    const mapped = pagePaths(slug)
    if (mapped || PAGE_ROUTES[slug]) {
      // Internal keys match EN slug segments (home → /en + /zh).
      if (slug === 'home') {
        return unique([...home, sitemap])
      }
      return unique([localePath('en', `/${slug}`), localePath('zh', `/${slug}`), sitemap])
    }
    return unique([
      localePath('en', `/${slug}`),
      localePath('zh', `/${zhSlug}`),
      sitemap,
    ])
  }

  return unique([sitemap])
}
