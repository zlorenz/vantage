import type {ComponentType} from 'react'
import {
  DocumentsIcon,
  EarthGlobeIcon,
  FolderIcon,
  ImageIcon,
  TagIcon,
  UsersIcon,
  BookIcon,
  ComposeIcon,
  CogIcon,
  CaseIcon,
  TiersIcon,
} from '@sanity/icons'

export type ColumnId =
  | 'title'
  | 'status'
  | 'publishedAt'
  | 'updatedAt'
  | 'metaDescription'
  | 'focusKeyword'
  | 'slug'
  | 'categories'
  | 'parent'
  | 'usage'
  | 'role'
  | 'thumbnail'

export type TableColumn = {
  id: ColumnId
  header: string
  width?: string
  /** For flexible (width-less) columns: floor used to compute the table's min width. */
  minWidth?: string
  sortable?: boolean
}

export type ContentLeaf = {
  kind: 'leaf'
  id: string
  title: string
  documentType: string
  icon: ComponentType
  /** Hide "New" for singletons like siteSettings */
  canCreate?: boolean
  /** Label for the create button, e.g. "New Portfolio Item" */
  createLabel?: string
  /** Open this document ID directly instead of listing (singleton). */
  singletonId?: string
  /** Enable bulk Move to Trash / Trash view for this section. */
  supportsTrash?: boolean
  columns: TableColumn[]
  defaultSort: {field: string; direction: 'asc' | 'desc'}
  searchFields: string[]
}

export type ContentGroup = {
  kind: 'group'
  id: string
  title: string
  icon: ComponentType
  children: ContentLeaf[]
}

export type ContentNavItem = ContentLeaf | ContentGroup

const portfolioColumns: TableColumn[] = [
  {id: 'thumbnail', header: '', width: '56px'},
  {id: 'title', header: 'Title', minWidth: '240px', sortable: true},
  {id: 'status', header: 'Status', width: '110px', sortable: true},
  {id: 'publishedAt', header: 'Publish Date', width: '180px', sortable: true},
  {id: 'metaDescription', header: 'Meta Description', minWidth: '220px'},
  {id: 'focusKeyword', header: 'Keyphrase', width: '140px'},
]

const blogColumns: TableColumn[] = [
  {id: 'thumbnail', header: '', width: '56px'},
  {id: 'title', header: 'Title', minWidth: '240px', sortable: true},
  {id: 'status', header: 'Status', width: '110px', sortable: true},
  {id: 'publishedAt', header: 'Publish Date', width: '180px', sortable: true},
  {id: 'categories', header: 'Categories', width: '160px'},
  {id: 'metaDescription', header: 'Meta Description', minWidth: '220px'},
]

const pageColumns: TableColumn[] = [
  {id: 'thumbnail', header: '', width: '56px'},
  {id: 'title', header: 'Page Title', minWidth: '240px', sortable: true},
  {id: 'status', header: 'Status', width: '110px', sortable: true},
  {id: 'publishedAt', header: 'Publish Date', width: '180px', sortable: true},
  {id: 'metaDescription', header: 'Meta Description', minWidth: '220px'},
  {id: 'focusKeyword', header: 'Keyphrase', width: '140px'},
]

const taxonomyTitleColumns: TableColumn[] = [
  {id: 'title', header: 'Title', minWidth: '200px', sortable: true},
  {id: 'slug', header: 'Slug', width: '160px', sortable: true},
  {id: 'usage', header: 'Used by', width: '90px', sortable: true},
]

const industryColumns: TableColumn[] = [
  {id: 'title', header: 'Title', minWidth: '200px', sortable: true},
  {id: 'parent', header: 'Parent', width: '140px', sortable: true},
  {id: 'slug', header: 'Slug', width: '160px', sortable: true},
  {id: 'usage', header: 'Used by', width: '90px', sortable: true},
]

const namedTaxonomyColumns: TableColumn[] = [
  {id: 'title', header: 'Name', minWidth: '200px', sortable: true},
  {id: 'slug', header: 'Slug', width: '160px', sortable: true},
  {id: 'usage', header: 'Used by', width: '90px', sortable: true},
]

const crewColumns: TableColumn[] = [
  {id: 'title', header: 'Name', minWidth: '200px', sortable: true},
  {id: 'role', header: 'Role', width: '140px', sortable: true},
  {id: 'slug', header: 'Slug', width: '160px', sortable: true},
  {id: 'usage', header: 'Used by', width: '90px', sortable: true},
]

export const SITE_NAME = 'Vantage Pictures'

export const NAV_ITEMS: ContentNavItem[] = [
  {
    kind: 'group',
    id: 'portfolio',
    title: 'Portfolio',
    icon: FolderIcon,
    children: [
      {
        kind: 'leaf',
        id: 'portfolio-items',
        title: 'Portfolio Items',
        documentType: 'portfolioEntry',
        icon: ImageIcon,
        createLabel: 'New Portfolio Item',
        supportsTrash: true,
        columns: portfolioColumns,
        defaultSort: {field: 'publishedAt', direction: 'desc'},
        searchFields: ['title', 'titleZh', 'slug', 'metaDescription', 'focusKeyword'],
      },
      {
        kind: 'leaf',
        id: 'video-formats',
        title: 'Video Formats',
        documentType: 'videoFormat',
        icon: TiersIcon,
        columns: taxonomyTitleColumns,
        defaultSort: {field: 'title', direction: 'asc'},
        searchFields: ['title', 'titleZh', 'slug'],
      },
      {
        kind: 'leaf',
        id: 'industries',
        title: 'Industries',
        documentType: 'industry',
        icon: CaseIcon,
        columns: industryColumns,
        defaultSort: {field: 'title', direction: 'asc'},
        searchFields: ['title', 'titleZh', 'slug', 'parent'],
      },
      {
        kind: 'leaf',
        id: 'markets',
        title: 'Markets',
        documentType: 'market',
        icon: EarthGlobeIcon,
        columns: taxonomyTitleColumns,
        defaultSort: {field: 'title', direction: 'asc'},
        searchFields: ['title', 'titleZh', 'slug'],
      },
      {
        kind: 'leaf',
        id: 'clients',
        title: 'Clients',
        documentType: 'client',
        icon: UsersIcon,
        columns: namedTaxonomyColumns,
        defaultSort: {field: 'title', direction: 'asc'},
        searchFields: ['title', 'slug'],
      },
      {
        kind: 'leaf',
        id: 'crew-members',
        title: 'Crew Members',
        documentType: 'crewMember',
        icon: UsersIcon,
        columns: crewColumns,
        defaultSort: {field: 'title', direction: 'asc'},
        searchFields: ['title', 'slug', 'role'],
      },
    ],
  },
  {
    kind: 'group',
    id: 'blog',
    title: 'Blog',
    icon: BookIcon,
    children: [
      {
        kind: 'leaf',
        id: 'blog-posts',
        title: 'Posts',
        documentType: 'blogPost',
        icon: ComposeIcon,
        createLabel: 'New Post',
        supportsTrash: true,
        columns: blogColumns,
        defaultSort: {field: 'publishedAt', direction: 'desc'},
        searchFields: ['title', 'titleZh', 'slug', 'metaDescription', 'categories'],
      },
      {
        kind: 'leaf',
        id: 'categories',
        title: 'Categories',
        documentType: 'category',
        icon: TagIcon,
        columns: taxonomyTitleColumns,
        defaultSort: {field: 'title', direction: 'asc'},
        searchFields: ['title', 'titleZh', 'slug'],
      },
    ],
  },
  {
    kind: 'leaf',
    id: 'pages',
    title: 'Pages',
    documentType: 'page',
    icon: DocumentsIcon,
    createLabel: 'New Page',
    supportsTrash: true,
    columns: pageColumns,
    defaultSort: {field: 'title', direction: 'asc'},
    searchFields: ['title', 'titleZh', 'slug', 'metaDescription', 'focusKeyword'],
  },
  {
    kind: 'leaf',
    id: 'platforms',
    title: 'Platforms',
    documentType: 'platform',
    icon: EarthGlobeIcon,
    columns: namedTaxonomyColumns,
    defaultSort: {field: 'title', direction: 'asc'},
    searchFields: ['title', 'slug'],
  },
  {
    kind: 'leaf',
    id: 'site-settings',
    title: 'Site Settings',
    documentType: 'siteSettings',
    icon: CogIcon,
    canCreate: false,
    singletonId: 'siteSettings',
    columns: [{id: 'title', header: 'Title', sortable: true}],
    defaultSort: {field: 'title', direction: 'asc'},
    searchFields: ['title'],
  },
]

export function findLeaf(id: string): ContentLeaf | undefined {
  for (const item of NAV_ITEMS) {
    if (item.kind === 'leaf' && item.id === id) return item
    if (item.kind === 'group') {
      const child = item.children.find((c) => c.id === id)
      if (child) return child
    }
  }
  return undefined
}

export function defaultLeafId(): string {
  return 'portfolio-items'
}
