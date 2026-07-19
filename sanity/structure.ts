import type {StructureResolver} from 'sanity/structure'

/**
 * Flat top-level lists so edit tabs opened from the Content tool
 * render as list + editor (2 panes max), not nested folder columns.
 * Day-to-day browsing lives in the Content tool accordion sidebar.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('portfolioEntry').title('Portfolio Items'),
      S.documentTypeListItem('videoFormat'),
      S.documentTypeListItem('industry'),
      S.documentTypeListItem('market'),
      S.documentTypeListItem('client'),
      S.documentTypeListItem('crewMember'),
      S.divider(),
      S.documentTypeListItem('blogPost').title('Blog Posts'),
      S.documentTypeListItem('category'),
      S.divider(),
      S.documentTypeListItem('page'),
      S.documentTypeListItem('platform'),
      S.documentTypeListItem('siteSettings'),
    ])
