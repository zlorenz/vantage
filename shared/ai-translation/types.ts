/** Shared types for the Sanity Translations dashboard (manual EN→zh-CN). */

export type FieldKind = 'plain' | 'html' | 'portableText' | 'slug' | 'excerpt-from-body'

export type TranslateDocumentType =
  | 'portfolioEntry'
  | 'blogPost'
  | 'page'
  | 'industry'
  | 'market'
  | 'videoFormat'
  | 'category'
  | 'siteSettings'

export type FieldMapping = {
  /** Dot path for English source (may be empty for excerpt-from-body). */
  enPath: string
  /** Dot path for Chinese target. */
  zhPath: string
  kind: FieldKind
  /** Human label for the dashboard. */
  label: string
  /** Where this appears on the public site. */
  where: string
  /** Slug fields: typically filled only when empty. */
  slugEmptyOnly?: boolean
}

export type DashboardTabId =
  | 'gaps'
  | 'pages'
  | 'portfolio'
  | 'news'
  | 'taxonomies'
  | 'seo'
  | 'slugs'
  | 'brand-names'
  | 'phrases'
  | 'ui-chrome'
  | 'campaign-brief'
  | 'credits-labels'

export type DashboardRowSource = 'cms' | 'code'

export type DashboardRow = {
  id: string
  tab: DashboardTabId
  english: string
  chinese: string
  where: string
  source: DashboardRowSource
  editable: boolean
  status: 'missing' | 'present'
  /** Sanity document id when CMS-backed. */
  documentId?: string
  documentType?: string
  /** Patch path for ZH value (e.g. titleZh, seo.metaDescriptionZh). */
  zhPath?: string
  /** Code file hint for read-only rows. */
  codePath?: string
}
