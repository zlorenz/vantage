import {defineLocations, type PresentationPluginOptions} from 'sanity/presentation'

import {getFrontEndUrl, type FrontEndDocument} from '../tools/content/front-end-url'

/**
 * Presentation document locations. REUSES getFrontEndUrl (the same helper behind
 * document.productionUrl) so front-end URLs have a single source of truth.
 *
 * getFrontEndUrl returns an ABSOLUTE url; Presentation href wants a path relative
 * to the preview origin, so we take the pathname. Pilot scope: blogPost only.
 * Add portfolioEntry / page here later — same pattern.
 */

function toPath(abs: string | undefined): string | undefined {
  if (!abs) return undefined
  try {
    return new URL(abs).pathname
  } catch {
    return undefined
  }
}

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    blogPost: defineLocations({
      // Select the WHOLE slug objects (not slug.current) — getFrontEndUrl's
      // readSlug expects {current} or string, and reads slug + slugZh.
      select: {
        title: 'title',
        slug: 'slug',
        slugZh: 'slugZh',
      },
      resolve: (doc) => {
        const snapshot = {slug: doc?.slug, slugZh: doc?.slugZh} as FrontEndDocument
        const enPath = toPath(getFrontEndUrl('blogPost', snapshot, {locale: 'en'}))
        const zhPath = toPath(getFrontEndUrl('blogPost', snapshot, {locale: 'zh'}))
        const title = (doc?.title as string) || 'Untitled post'

        const locations = []
        if (enPath) locations.push({title, href: enPath})
        if (zhPath && zhPath !== enPath) locations.push({title: `${title} (中文)`, href: zhPath})
        return {locations}
      },
    }),
  },
}
