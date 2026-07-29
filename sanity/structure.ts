import type {StructureResolver} from 'sanity/structure'

import {STUDIO_PAGE_LIST_GROQ_FILTER} from './lib/page-visibility'

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
      // Legacy client / crewMember types stay in the schema (orphaned WP mirrors)
      // but are omitted here — day-to-day entities live under Content → Crew Members
      // (creditIdentity). Creation is also blocked in sanity.config.ts.
      S.divider(),
      S.documentTypeListItem('blogPost').title('Blog Posts'),
      S.documentTypeListItem('category'),
      S.divider(),
      S.listItem()
        .title('Pages')
        .schemaType('page')
        .child(
          S.documentTypeList('page')
            .title('Pages')
            .filter(`_type == "page" && ${STUDIO_PAGE_LIST_GROQ_FILTER}`),
        ),
      S.documentTypeListItem('platform'),
      S.documentTypeListItem('translatedPhrase').title('Phrases (EN→ZH)'),
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .schemaType('siteSettings')
        .child(
          S.document().schemaType('siteSettings').documentId('siteSettings'),
        ),
    ])
