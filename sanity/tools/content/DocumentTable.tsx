import {useCallback, useEffect, useMemo, useState, type CSSProperties} from 'react'
import {getPublishedId, useClient, useCurrentUser} from 'sanity'
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  Spinner,
  Stack,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'
import {
  AddIcon,
  ChevronDownIcon,
  CloseIcon,
  EyeClosedIcon,
  FilterIcon,
  SearchIcon,
  TrashIcon,
} from '@sanity/icons'
import {compileDisplayTitles, trimPart} from '@display-titles'
import {
  CREW_DEPARTMENTS,
  CREW_ROLE_BY_KEY,
  FILTER_CREDIT_ROLE_KEYS,
  IDENTITY_USAGE_PORTFOLIOS_STUDIO_QUERY,
  resolveUsageForIdentities,
  type CrewDepartmentKey,
  type IdentityUsagePortfolio,
} from '@crew-credits'
import type {ContentLeaf, ColumnId} from './sections'
import {STUDIO_PAGE_LIST_GROQ_FILTER} from '../../lib/page-visibility'
import {
  formatImpactSummary,
  bulkSetPortfolioHidden,
  moveToTrash,
  permanentlyDelete,
  preflightTrash,
  restoreFromTrash,
  type InboundReferenceImpact,
  type TrashPreflightItem,
} from './document-lifecycle'
import {getStudioRole} from '../../lib/studio-roles'

type DisplayTitlePartsDoc = {
  brandName?: string
  productName?: string
  campaignTitle?: string
}

function titleFromDoc(doc: Record<string, unknown>): string {
  const parts = doc.displayTitleParts as DisplayTitlePartsDoc | undefined
  if (parts && trimPart(parts.brandName)) {
    const compiled = compileDisplayTitles({
      brandName: parts.brandName,
      productName: parts.productName,
      campaignTitle: parts.campaignTitle,
    }).documentTitle
    if (trimPart(compiled)) return compiled
  }
  return String(doc.title ?? '')
}

type Row = {
  _id: string
  _type: string
  title: string
  titleZh?: string
  slug?: string
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
  metaDescription?: string
  isHidden?: boolean
  hasDraft?: boolean
  isDraftOnly?: boolean
  isScheduled?: boolean
  scheduledFor?: string
  /** Set when the row comes from a scheduled release version. */
  releaseId?: string
  versionId?: string
  isTrashed?: boolean
  trashedAt?: string
  purgeAfter?: string
  thumbnailUrl?: string
  categories?: string
  parent?: string
  usage?: number
  role?: string
  /** Role keys this creditIdentity appears in (from usage resolution). */
  roleKeys?: string[]
  /** Portfolio-entry counts per roleKey for creditIdentity rows. */
  usageByRole?: Partial<Record<string, number>>
}

type StatusFilter =
  | 'all'
  | 'published'
  | 'draft'
  | 'edited'
  | 'scheduled'
  | 'hidden'
  | 'trash'

type DocumentStatus = Exclude<StatusFilter, 'all' | 'trash'>

/** Department tab: all linked departments or one catalog department. */
type CrewDeptTab = 'all' | CrewDepartmentKey

/** Role sub-tab: all roles in scope, or one catalog role.key string. */
type CrewRoleFilter = 'all' | string

/** All standard Camera role keys (identity-linked after Camera apply). */
const CAMERA_LINKED_ROLE_KEYS: readonly string[] = CREW_DEPARTMENTS.find(
  (dept) => dept.key === 'camera',
)!.roles.map((role) => role.key)

const ART_LINKED_ROLE_KEYS: readonly string[] = CREW_DEPARTMENTS.find(
  (dept) => dept.key === 'art',
)!.roles.map((role) => role.key)

const POST_LINKED_ROLE_KEYS: readonly string[] = CREW_DEPARTMENTS.find(
  (dept) => dept.key === 'post',
)!.roles.map((role) => role.key)

const PRODUCTION_LINKED_ROLE_KEYS: readonly string[] = CREW_DEPARTMENTS.find(
  (dept) => dept.key === 'production',
)!.roles.map((role) => role.key)

/**
 * Identity-linked standard roles per department (live data scope).
 * Other departments stay empty until their link apply.
 */
const LINKED_DEPT_ROLE_KEYS: Record<CrewDepartmentKey, readonly string[]> = {
  production: PRODUCTION_LINKED_ROLE_KEYS,
  camera: CAMERA_LINKED_ROLE_KEYS,
  art: ART_LINKED_ROLE_KEYS,
  post: POST_LINKED_ROLE_KEYS,
  stills: [
    'photographer',
    'photography_assistant',
    'photography_producer',
    'kv_art_director',
  ],
  casting: [
    'animal_wrangler',
    'casting_director',
    'casting_manager',
    'choreographer',
    'stunt_coordinator',
    'talent',
  ],
  ge: ['electrician', 'gaffer', 'grip', 'key_grip', 'rental_house'],
}

/** Role keys passed to resolveUsageForIdentities for Crew Members "Used by". */
const CREW_USAGE_ROLE_KEYS: readonly string[] = [
  ...new Set(Object.values(LINKED_DEPT_ROLE_KEYS).flat()),
]

/** Legacy filter-tab labels preserved for the five Work Library roles. */
const FILTER_ROLE_TAB_LABELS: Partial<Record<(typeof FILTER_CREDIT_ROLE_KEYS)[number], string>> =
  {
    brand: 'Clients',
    director: 'Directors',
    dop: 'DOPs',
    art_director: 'Art Directors',
    editor: 'Editors',
  }

function crewRoleTabLabel(roleKey: string): string {
  const filterLabel = FILTER_ROLE_TAB_LABELS[roleKey as (typeof FILTER_CREDIT_ROLE_KEYS)[number]]
  if (filterLabel) return filterLabel
  return CREW_ROLE_BY_KEY.get(roleKey)?.role.label ?? roleKey
}

/** Group an identity's roleKeys by catalog department for the Roles column. */
function rolesGroupedByDepartment(
  roleKeys: string[] | undefined,
): Array<{departmentLabel: string; roleLabels: string[]}> {
  if (!roleKeys?.length) return []

  const byDept = new Map<
    string,
    {sortIndex: number; departmentLabel: string; roleLabels: string[]}
  >()

  for (const roleKey of roleKeys) {
    const resolved = CREW_ROLE_BY_KEY.get(roleKey)
    const departmentKey = resolved?.departmentKey ?? 'other'
    const departmentLabel = resolved?.departmentLabel ?? 'Other'
    const sortIndex = resolved?.sortIndex ?? 99999
    const roleLabel = crewRoleTabLabel(roleKey)
    const existing = byDept.get(departmentKey)
    if (existing) {
      existing.roleLabels.push(roleLabel)
    } else {
      byDept.set(departmentKey, {
        sortIndex,
        departmentLabel,
        roleLabels: [roleLabel],
      })
    }
  }

  return [...byDept.values()]
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map(({departmentLabel, roleLabels}) => ({departmentLabel, roleLabels}))
}

function linkedRolesForDept(dept: CrewDeptTab): readonly string[] {
  if (dept === 'all') return CREW_USAGE_ROLE_KEYS
  return LINKED_DEPT_ROLE_KEYS[dept]
}

function deptHasLinkedRoles(dept: CrewDepartmentKey): boolean {
  return LINKED_DEPT_ROLE_KEYS[dept].length > 0
}

function rowMatchesDept(row: Row, dept: CrewDeptTab): boolean {
  if (dept === 'all') return true
  const linked = LINKED_DEPT_ROLE_KEYS[dept]
  if (!linked.length) return false
  return linked.some((roleKey) => row.roleKeys?.includes(roleKey))
}

const STATUS_FILTER_TABS: Array<{id: Exclude<StatusFilter, 'trash'>; label: string}> = [
  {id: 'all', label: 'All'},
  {id: 'published', label: 'Published'},
  {id: 'draft', label: 'Draft'},
  {id: 'edited', label: 'Edited'},
  {id: 'scheduled', label: 'Scheduled'},
  {id: 'hidden', label: 'Hidden'},
]

const STATUS_LABELS: Record<DocumentStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  edited: 'Edited',
  scheduled: 'Scheduled',
  hidden: 'Hidden',
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Director',
  dop: 'DOP',
  'art-director': 'Art Director',
}

function baseId(id: string): string {
  return id.replace(/^drafts\./, '')
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function buildQuery(documentType: string): string {
  switch (documentType) {
    case 'portfolioEntry':
      return `*[_type == "portfolioEntry" && !(_id in path("versions.**"))] | order(publishedAt desc, title asc) {
        _id,
        _type,
        title,
        titleZh,
        displayTitleParts{
          brandName,
          productName,
          campaignTitle
        },
        "slug": slug.current,
        publishedAt,
        "_updatedAt": _updatedAt,
        "metaDescription": seo.metaDescription,
        isHidden,
        trash,
        "hasDraft": count(*[_id == "drafts." + ^._id]) > 0,
        "thumbnailUrl": featuredImage.asset->url + "?w=80&h=80&fit=crop"
      }`
    case 'blogPost':
      // Match the public news index: newest first by published date.
      return `*[_type == "blogPost" && !(_id in path("versions.**"))] | order(publishedAt desc) {
        _id,
        _type,
        title,
        titleZh,
        "slug": slug.current,
        publishedAt,
        "_createdAt": _createdAt,
        "_updatedAt": _updatedAt,
        "metaDescription": seo.metaDescription,
        trash,
        "hasDraft": count(*[_id == "drafts." + ^._id]) > 0,
        "thumbnailUrl": featuredImage.asset->url + "?w=80&h=80&fit=crop",
        "categories": array::join(categories[]->title, ", ")
      }`
    case 'page':
      return `*[_type == "page" && ${STUDIO_PAGE_LIST_GROQ_FILTER} && !(_id in path("versions.**"))] | order(title asc) {
        _id,
        _type,
        title,
        titleZh,
        "slug": slug.current,
        "_updatedAt": _updatedAt,
        "metaDescription": seo.metaDescription,
        trash,
        "hasDraft": count(*[_id == "drafts." + ^._id]) > 0,
        "thumbnailUrl": featuredImage.asset->url + "?w=80&h=80&fit=crop"
      }`
    case 'industry':
      return `*[_type == "industry" && !(_id in path("versions.**"))] | order(title asc) {
        _id,
        _type,
        title,
        titleZh,
        "slug": slug.current,
        "parent": parent->title,
        "usage": count(*[_type == "portfolioEntry" && references(^._id)])
      }`
    case 'videoFormat':
    case 'market':
    case 'category':
      return `*[_type == $type && !(_id in path("versions.**"))] | order(title asc) {
        _id,
        _type,
        title,
        titleZh,
        "slug": slug.current,
        "usage": count(*[references(^._id)])
      }`
    case 'platform':
      return `*[_type == $type && !(_id in path("versions.**"))] | order(name asc) {
        _id,
        _type,
        "title": name,
        "slug": slug.current,
        "usage": count(*[references(^._id)])
      }`
    case 'creditIdentity':
      // Usage is computed client-side via resolveUsageForIdentities on
      // IDENTITY_USAGE_PORTFOLIOS_STUDIO_QUERY — all non-trashed published
      // portfolios including hidden. Intentionally not limited to the
      // work-internal public facet (hidden projects still count as credits).
      return `*[_type == "creditIdentity" && !(_id in path("versions.**"))] | order(name asc) {
        _id,
        _type,
        "title": name,
        nameZh,
        "_createdAt": _createdAt
      }`
    case 'translatedPhrase':
      return `*[_type == "translatedPhrase" && !(_id in path("versions.**"))] | order(en asc) {
        _id,
        _type,
        "title": en,
        "slug": zh
      }`
    case 'siteSettings':
      return `*[_type == "siteSettings"]{
        _id,
        _type,
        "title": "Site Settings"
      }`
    default:
      return `*[_type == $type && !(_id in path("versions.**"))] | order(_updatedAt desc) {
        _id,
        _type,
        title
      }`
  }
}

type ScheduledRelease = {
  releaseId?: string
  scheduledFor?: string
  documents?: Array<Record<string, unknown> & {_id: string}>
}

function normalizeRows(
  raw: Record<string, unknown>[],
  scheduledReleases: ScheduledRelease[],
): Row[] {
  const pairs = new Map<
    string,
    {
      published?: Record<string, unknown>
      draft?: Record<string, unknown>
      scheduled?: Record<string, unknown>
      releaseId?: string
      versionId?: string
    }
  >()

  for (const doc of raw) {
    const id = String(doc._id)
    const publishedId = getPublishedId(id)
    const pair = pairs.get(publishedId) ?? {}
    if (id.startsWith('drafts.')) pair.draft = doc
    else pair.published = doc
    pairs.set(publishedId, pair)
  }

  const schedules = new Map<string, string>()
  for (const release of scheduledReleases) {
    if (!release.scheduledFor) continue
    for (const document of release.documents ?? []) {
      const docId = String(document._id)
      const publishedId = getPublishedId(docId)
      schedules.set(publishedId, release.scheduledFor)
      const pair = pairs.get(publishedId) ?? {}
      pair.scheduled = document
      pair.releaseId = release.releaseId || pair.releaseId
      pair.versionId = docId.startsWith('versions.') ? docId : pair.versionId
      pairs.set(publishedId, pair)
    }
  }

  return [...pairs.entries()].map(([publishedId, pair]) => {
    // Show the latest working values while retaining pair-level publication state.
    const doc = pair.scheduled ?? pair.draft ?? pair.published!
    const trashFromDraft = (pair.draft?.trash || null) as
      | {trashedAt?: string; purgeAfter?: string}
      | null
    const trashFromPublished = (pair.published?.trash || null) as
      | {trashedAt?: string; purgeAfter?: string}
      | null
    const trashFromScheduled = (pair.scheduled?.trash || null) as
      | {trashedAt?: string; purgeAfter?: string}
      | null
    const trash = trashFromDraft?.trashedAt
      ? trashFromDraft
      : trashFromPublished?.trashedAt
        ? trashFromPublished
        : trashFromScheduled?.trashedAt
          ? trashFromScheduled
          : trashFromDraft || trashFromPublished || trashFromScheduled
    return {
      _id: publishedId,
      _type: String(doc._type),
      title: titleFromDoc(doc),
      titleZh: doc.titleZh
        ? String(doc.titleZh)
        : doc.nameZh
          ? String(doc.nameZh)
          : undefined,
      slug: doc.slug ? String(doc.slug) : undefined,
      publishedAt: doc.publishedAt
        ? String(doc.publishedAt)
        : doc._createdAt
          ? String(doc._createdAt)
          : undefined,
      createdAt: doc._createdAt ? String(doc._createdAt) : undefined,
      updatedAt: doc._updatedAt ? String(doc._updatedAt) : undefined,
      metaDescription: doc.metaDescription ? String(doc.metaDescription) : undefined,
      isHidden: Boolean(doc.isHidden),
      hasDraft: Boolean(pair.draft),
      isDraftOnly: Boolean(pair.draft && !pair.published),
      isScheduled: Boolean(pair.scheduled) && !trash?.trashedAt,
      scheduledFor: schedules.get(publishedId),
      releaseId: pair.releaseId,
      versionId: pair.versionId,
      isTrashed: Boolean(trash?.trashedAt),
      trashedAt: trash?.trashedAt ? String(trash.trashedAt) : undefined,
      purgeAfter: trash?.purgeAfter ? String(trash.purgeAfter) : undefined,
      thumbnailUrl: doc.thumbnailUrl ? String(doc.thumbnailUrl) : undefined,
      categories: doc.categories ? String(doc.categories) : undefined,
      parent: doc.parent ? String(doc.parent) : undefined,
      usage: typeof doc.usage === 'number' ? doc.usage : undefined,
      role: doc.role ? String(doc.role) : undefined,
    }
  })
}

type TrashRecordRow = {
  targetId: string
  targetType?: string
  title?: string
  trashedAt?: string
  purgeAfter?: string
}

/** Ensure every trashRecord appears as a row, even if only a version doc remains. */
function mergeTrashRecords(rows: Row[], records: TrashRecordRow[]): Row[] {
  if (records.length === 0) return rows
  const byId = new Map(rows.map((row) => [row._id, row]))
  for (const record of records) {
    const existing = byId.get(record.targetId)
    if (existing) {
      byId.set(record.targetId, {
        ...existing,
        isTrashed: true,
        isScheduled: false,
        trashedAt: existing.trashedAt || record.trashedAt,
        purgeAfter: existing.purgeAfter || record.purgeAfter,
        title: existing.title || record.title || existing._id,
      })
      continue
    }
    byId.set(record.targetId, {
      _id: record.targetId,
      _type: record.targetType || 'portfolioEntry',
      title: record.title || record.targetId,
      isTrashed: true,
      trashedAt: record.trashedAt,
      purgeAfter: record.purgeAfter,
      isDraftOnly: true,
    })
  }
  return [...byId.values()]
}

function documentStatus(row: Row): DocumentStatus {
  if (row.isScheduled) return 'scheduled'
  if (row.isDraftOnly) return 'draft'
  if (row.isHidden) return 'hidden'
  if (row.hasDraft) return 'edited'
  return 'published'
}

function statusLabel(row: Row): string {
  return STATUS_LABELS[documentStatus(row)]
}

function statusTone(
  row: Row,
): 'caution' | 'critical' | 'positive' | 'default' {
  if (row.isScheduled) return 'caution'
  if (row.isDraftOnly) return 'default'
  if (row.isHidden) return 'critical'
  if (row.hasDraft) return 'caution'
  return 'positive'
}

function statusStyle(row: Row): CSSProperties | undefined {
  // Scheduled must render identically to Edited (plain caution tone),
  // even though scheduled docs are often draft-only too.
  if (row.isScheduled) return undefined
  if (row.isDraftOnly) {
    return {background: '#3f3f46', borderColor: '#52525b', color: '#ffffff'}
  }
  if (row.isHidden) {
    return {background: '#7f1d1d', borderColor: '#991b1b', color: '#fff1f2'}
  }
  return undefined
}

function usageForTab(row: Row, roleFilter: CrewRoleFilter): number {
  if (roleFilter === 'all') return row.usage ?? 0
  return row.usageByRole?.[roleFilter] ?? 0
}

function sortValue(
  row: Row,
  field: string,
  roleFilter: CrewRoleFilter = 'all',
): string | number {
  switch (field) {
    case 'title':
      return (row.title || '').toLowerCase()
    case 'publishedAt':
      return row.isScheduled && row.scheduledFor
        ? new Date(row.scheduledFor).getTime()
        : row.publishedAt
          ? new Date(row.publishedAt).getTime()
          : 0
    case 'createdAt':
      return row.createdAt ? new Date(row.createdAt).getTime() : 0
    case 'updatedAt':
      return row.updatedAt ? new Date(row.updatedAt).getTime() : 0
    case 'status':
      return statusLabel(row)
    case 'slug':
      return (row.slug || '').toLowerCase()
    case 'usage':
      return usageForTab(row, roleFilter)
    case 'parent':
      return (row.parent || '').toLowerCase()
    case 'role':
      return (row.role || '').toLowerCase()
    default:
      return ''
  }
}

function CellContent({
  columnId,
  row,
  crewRoleFilter = 'all',
}: {
  columnId: ColumnId
  row: Row
  crewRoleFilter?: CrewRoleFilter
}) {
  switch (columnId) {
    case 'thumbnail':
      return row.thumbnailUrl ? (
        <img
          src={row.thumbnailUrl}
          alt=""
          width={40}
          height={40}
          style={{objectFit: 'cover', borderRadius: 4, display: 'block'}}
        />
      ) : (
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            background: 'var(--card-muted-bg-color)',
          }}
        />
      )
    case 'title':
      return (
        <Stack space={1}>
          <Text size={1} weight="semibold">
            {row.title || 'Untitled'}
          </Text>
          {row.titleZh ? (
            <Text size={0} muted>
              {row.titleZh}
            </Text>
          ) : null}
        </Stack>
      )
    case 'status':
      return (
        <Badge tone={statusTone(row)} fontSize={0} style={statusStyle(row)}>
          {statusLabel(row)}
        </Badge>
      )
    case 'publishedAt':
      return (
        <Text size={1}>
          {row.isScheduled
            ? formatDateTime(row.scheduledFor)
            : row._type === 'portfolioEntry' || row._type === 'blogPost'
              ? formatDate(row.publishedAt)
              : formatDateTime(row.publishedAt)}
        </Text>
      )
    case 'createdAt':
      return <Text size={1}>{formatDate(row.createdAt)}</Text>
    case 'updatedAt':
      return <Text size={1}>{formatDate(row.updatedAt)}</Text>
    case 'metaDescription':
      return (
        <Text
          size={1}
          muted={!row.metaDescription}
          title={row.metaDescription || undefined}
        >
          {/* Clamp on an inner span: Sanity UI Text trims line-height with
              negative pseudo-element margins, so overflow:hidden on the Text
              root clips the top of the first line. */}
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              whiteSpace: 'normal',
            }}
          >
            {row.metaDescription || '—'}
          </span>
        </Text>
      )
    case 'slug':
      return <Text size={1}>{row.slug || '—'}</Text>
    case 'categories':
      return <Text size={1}>{row.categories || '—'}</Text>
    case 'parent':
      return <Text size={1}>{row.parent || '—'}</Text>
    case 'usage':
      return <Text size={1}>{usageForTab(row, crewRoleFilter)}</Text>
    case 'role':
      return <Text size={1}>{ROLE_LABELS[row.role || ''] || row.role || '—'}</Text>
    case 'roles': {
      // No new GROQ — uses roleKeys already attached via resolveUsageForIdentities.
      const groups = rolesGroupedByDepartment(row.roleKeys)
      if (!groups.length) {
        return (
          <Text size={1} muted>
            —
          </Text>
        )
      }
      return (
        <Stack space={2}>
          {groups.map((group) => (
            <Stack key={group.departmentLabel} space={1}>
              <Text size={0} muted weight="semibold">
                {group.departmentLabel}
              </Text>
              <Text size={1}>{group.roleLabels.join(', ')}</Text>
            </Stack>
          ))}
        </Stack>
      )
    }
    default:
      return <Text size={1}>—</Text>
  }
}

type DocumentTableProps = {
  section: ContentLeaf
  onOpenDocument: (documentId: string, documentType: string, title?: string) => void
  onCreateDocument: () => void
}

export function DocumentTable({
  section,
  onOpenDocument,
  onCreateDocument,
}: DocumentTableProps) {
  // Raw perspective keeps drafts.* IDs so we can distinguish Draft / Edited / Published.
  const studioClient = useClient({apiVersion: '2025-02-19'})
  const client = useMemo(
    () => studioClient.withConfig({perspective: 'raw'}),
    [studioClient],
  )
  const toast = useToast()
  const currentUser = useCurrentUser()
  const role = getStudioRole(currentUser)
  const isAdmin = role === 'admin'
  const isTranslator = role === 'translator'
  const supportsTrash = Boolean(section.supportsTrash)
  const canMoveToTrash = supportsTrash && !isTranslator
  const canBulkHide =
    section.documentType === 'portfolioEntry' && !isTranslator
  const canPermanentlyDelete = supportsTrash && isAdmin
  const supportsStatusFilter = section.columns.some((col) => col.id === 'status')
  const statusFilterTabs = useMemo(() => {
    if (!supportsStatusFilter) return []
    // Hidden is portfolio-only (`isHidden`); pages/posts have no equivalent.
    if (section.documentType === 'portfolioEntry') return STATUS_FILTER_TABS
    return STATUS_FILTER_TABS.filter((tab) => tab.id !== 'hidden')
  }, [section.documentType, supportsStatusFilter])

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState(section.defaultSort)
  const [crewDeptTab, setCrewDeptTab] = useState<CrewDeptTab>('all')
  const [crewRoleFilter, setCrewRoleFilter] = useState<CrewRoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reloadKey, setReloadKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<
    | null
    | {
        kind: 'trash' | 'delete' | 'empty' | 'hide'
        ids: string[]
        preflight?: TrashPreflightItem[]
        hints?: Record<
          string,
          {releaseId?: string; versionId?: string; title?: string}
        >
      }
  >(null)

  const inTrash = statusFilter === 'trash'

  useEffect(() => {
    setSort(section.defaultSort)
    setSearch('')
    setCrewDeptTab('all')
    setCrewRoleFilter('all')
    setStatusFilter('all')
    setSelected(new Set())
  }, [section.id, section.defaultSort])

  useEffect(() => {
    setSelected(new Set())
  }, [crewDeptTab, crewRoleFilter, statusFilter])

  // Drop Hidden when leaving portfolio; keep a valid tab.
  useEffect(() => {
    if (
      statusFilter === 'hidden' &&
      !statusFilterTabs.some((tab) => tab.id === 'hidden')
    ) {
      setStatusFilter('all')
    }
  }, [statusFilter, statusFilterTabs])

  // Trash tab only exists when the section supports it.
  useEffect(() => {
    if (statusFilter === 'trash' && !supportsTrash) {
      setStatusFilter('all')
    }
  }, [statusFilter, supportsTrash])

  const loadRows = useCallback(() => {
    setReloadKey((value) => value + 1)
  }, [])

  useEffect(() => {
    if (section.singletonId) {
      setLoading(false)
      setRows([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const query = buildQuery(section.documentType)
    const params =
      section.documentType === 'videoFormat' ||
      section.documentType === 'market' ||
      section.documentType === 'category' ||
      section.documentType === 'platform'
        ? {type: section.documentType}
        : {}

    const identityUsagePromise =
      section.documentType === 'creditIdentity'
        ? client
            .fetch<IdentityUsagePortfolio[]>(IDENTITY_USAGE_PORTFOLIOS_STUDIO_QUERY)
            .catch(() => [] as IdentityUsagePortfolio[])
        : Promise.resolve([] as IdentityUsagePortfolio[])

    Promise.all([
      client.fetch<Record<string, unknown>[]>(query, params),
      client
        .fetch<ScheduledRelease[]>(
          `releases::all()[metadata.cardinality == "one" && state == "scheduled"]{
            "releaseId": string::split(_id, ".")[2],
            "scheduledFor": coalesce(publishAt, metadata.intendedPublishAt),
            "documents": *[
              sanity::partOfRelease(string::split(^._id, ".")[2])
            ]{
              _id,
              _type,
              "title": coalesce(title, name),
              titleZh,
              displayTitleParts{
                brandName,
                productName,
                campaignTitle
              },
              "slug": slug.current,
              publishedAt,
              "_updatedAt": _updatedAt,
              "metaDescription": seo.metaDescription,
              isHidden,
              trash,
              "thumbnailUrl": featuredImage.asset->url + "?w=80&h=80&fit=crop",
              "categories": array::join(categories[]->title, ", "),
              "parent": parent->title,
              role
            }
          }`,
        )
        .catch(() => [] as ScheduledRelease[]),
      supportsTrash
        ? client
            .fetch<TrashRecordRow[]>(
              `*[_type == "trashRecord" && targetType == $targetType]{
                targetId, targetType, title, trashedAt, purgeAfter
              }`,
              {targetType: section.documentType},
            )
            .catch(() => [] as TrashRecordRow[])
        : Promise.resolve([] as TrashRecordRow[]),
      identityUsagePromise,
    ])
      .then(([docs, scheduledReleases, trashRecords, usagePortfolios]) => {
        if (cancelled) return
        let normalized = normalizeRows(docs, scheduledReleases)

        if (section.documentType === 'creditIdentity') {
          const usageById = resolveUsageForIdentities(
            normalized.map((row) => ({
              _id: baseId(row._id),
              name: row.title,
            })),
            usagePortfolios,
            {roleKeys: CREW_USAGE_ROLE_KEYS},
          )
          normalized = normalized.map((row) => {
            const usage = usageById.get(baseId(row._id))
            return {
              ...row,
              usage: usage?.usage ?? 0,
              roleKeys: usage?.roleKeys ?? [],
              usageByRole: usage?.usageByRole ?? {},
            }
          })
        }

        setRows(
          supportsTrash ? mergeTrashRecords(normalized, trashRecords) : normalized,
        )
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    client,
    reloadKey,
    section.documentType,
    section.id,
    section.singletonId,
    supportsTrash,
  ])

  const activeCount = useMemo(
    () => rows.filter((row) => !row.isTrashed).length,
    [rows],
  )
  const trashCount = useMemo(
    () => rows.filter((row) => row.isTrashed).length,
    [rows],
  )

  const isCrewMembersSection = section.documentType === 'creditIdentity'

  const statusCounts = useMemo(() => {
    const counts: Record<Exclude<StatusFilter, 'trash'>, number> = {
      all: 0,
      published: 0,
      draft: 0,
      edited: 0,
      scheduled: 0,
      hidden: 0,
    }
    if (!supportsStatusFilter) return counts
    for (const row of rows) {
      if (row.isTrashed) continue
      counts.all += 1
      counts[documentStatus(row)] += 1
    }
    return counts
  }, [rows, supportsStatusFilter])

  const linkedRolesInScope = useMemo(
    () => linkedRolesForDept(crewDeptTab),
    [crewDeptTab],
  )

  const showCrewNotLinkedState =
    isCrewMembersSection &&
    crewDeptTab !== 'all' &&
    !deptHasLinkedRoles(crewDeptTab)

  const crewDeptCounts = useMemo(() => {
    const counts = {
      all: 0,
      ...Object.fromEntries(CREW_DEPARTMENTS.map((dept) => [dept.key, 0])),
    } as Record<CrewDeptTab, number>
    if (!isCrewMembersSection) return counts
    for (const row of rows) {
      if (row.isTrashed) continue
      counts.all += 1
      for (const dept of CREW_DEPARTMENTS) {
        if (rowMatchesDept(row, dept.key)) counts[dept.key] += 1
      }
    }
    return counts
  }, [isCrewMembersSection, rows])

  const crewRoleCounts = useMemo(() => {
    const counts: Record<string, number> = {all: 0}
    for (const roleKey of linkedRolesInScope) {
      counts[roleKey] = 0
    }
    if (!isCrewMembersSection) return counts
    for (const row of rows) {
      if (row.isTrashed) continue
      if (crewDeptTab !== 'all' && !rowMatchesDept(row, crewDeptTab)) continue
      const rolesInScope = row.roleKeys?.filter((key) =>
        linkedRolesInScope.includes(key),
      )
      if (!rolesInScope?.length) continue
      counts.all += 1
      for (const key of rolesInScope) {
        if (key in counts) counts[key] += 1
      }
    }
    return counts
  }, [crewDeptTab, isCrewMembersSection, linkedRolesInScope, rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let next = rows.filter((row) =>
      supportsTrash ? (inTrash ? row.isTrashed : !row.isTrashed) : true,
    )
    if (
      supportsStatusFilter &&
      !inTrash &&
      statusFilter !== 'all'
    ) {
      next = next.filter((row) => documentStatus(row) === statusFilter)
    }
    if (isCrewMembersSection && !showCrewNotLinkedState) {
      if (crewDeptTab !== 'all') {
        next = next.filter((row) => rowMatchesDept(row, crewDeptTab))
      }
      if (crewRoleFilter !== 'all') {
        next = next.filter((row) => row.roleKeys?.includes(crewRoleFilter))
      }
    }
    if (q) {
      next = next.filter((row) =>
        section.searchFields.some((field) => {
          const value =
            field === 'metaDescription'
              ? row.metaDescription
              : field === 'categories'
                  ? row.categories
                  : field === 'parent'
                    ? row.parent
                    : field === 'role'
                      ? row.role
                      : field === 'slug'
                        ? row.slug
                        : field === 'titleZh'
                          ? row.titleZh
                          : row.title
          return (value || '').toLowerCase().includes(q)
        }),
      )
    }

    const dir = sort.direction === 'asc' ? 1 : -1
    return [...next].sort((a, b) => {
      const av = sortValue(a, sort.field, crewRoleFilter)
      const bv = sortValue(b, sort.field, crewRoleFilter)
      if (typeof av === 'string' && typeof bv === 'string') {
        // Diacritic-insensitive (Álvaro → A…, Nguyễn → N…)
        const cmp = av.localeCompare(bv, undefined, {sensitivity: 'base'})
        return cmp * dir
      }
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [
    crewDeptTab,
    crewRoleFilter,
    showCrewNotLinkedState,
    inTrash,
    isCrewMembersSection,
    rows,
    search,
    section.searchFields,
    sort,
    statusFilter,
    supportsStatusFilter,
    supportsTrash,
  ])

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((row) => selected.has(row._id))

  const toggleSort = useCallback((field: string) => {
    setSort((prev) =>
      prev.field === field
        ? {field, direction: prev.direction === 'asc' ? 'desc' : 'asc'}
        : {field, direction: field === 'title' || field === 'slug' ? 'asc' : 'desc'},
    )
  }, [])

  const toggleRow = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAllVisible = useCallback(() => {
    setSelected((prev) => {
      if (filtered.length === 0) return prev
      const allSelected = filtered.every((row) => prev.has(row._id))
      if (allSelected) {
        const next = new Set(prev)
        for (const row of filtered) next.delete(row._id)
        return next
      }
      const next = new Set(prev)
      for (const row of filtered) next.add(row._id)
      return next
    })
  }, [filtered])

  const actorLabel =
    currentUser?.name || currentUser?.email || currentUser?.id || 'Studio user'

  const hintsForIds = useCallback(
    (ids: string[]) => {
      const hints: Record<
        string,
        {releaseId?: string; versionId?: string; title?: string}
      > = {}
      for (const id of ids) {
        const row = rows.find((r) => r._id === id)
        if (!row) continue
        if (row.releaseId || row.versionId) {
          hints[id] = {
            releaseId: row.releaseId,
            versionId: row.versionId,
            title: row.title,
          }
        }
      }
      return hints
    },
    [rows],
  )

  const openTrashConfirm = useCallback(async () => {
    if (isTranslator) return
    const ids = [...selected]
    if (ids.length === 0) return
    const hints = hintsForIds(ids)

    setBusy(true)
    try {
      const preflight = await preflightTrash(client, ids)
      setConfirm({kind: 'trash', ids, preflight, hints})
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Fallback for rare release-locked ghosts inventory still can't see:
      // permanent delete using any release/version ids from the table row.
      if (/document not found/i.test(message)) {
        if (!isAdmin) {
          toast.push({
            status: 'error',
            title: 'Could not prepare Move to Trash',
            description: message,
          })
          return
        }
        setConfirm({kind: 'delete', ids, hints})
      } else {
        toast.push({
          status: 'error',
          title: 'Could not prepare Move to Trash',
          description: message,
        })
      }
    } finally {
      setBusy(false)
    }
  }, [client, hintsForIds, isAdmin, isTranslator, selected, toast])

  const openHideConfirm = useCallback(() => {
    if (!canBulkHide) return
    const ids = [...selected]
    if (ids.length === 0) return
    setConfirm({kind: 'hide', ids})
  }, [canBulkHide, selected])

  const runConfirm = useCallback(async () => {
    if (!confirm) return
    if (confirm.kind === 'trash' && isTranslator) return
    if (confirm.kind === 'hide' && isTranslator) return
    if ((confirm.kind === 'delete' || confirm.kind === 'empty') && !isAdmin) return
    setBusy(true)
    try {
      if (confirm.kind === 'trash') {
        const results = await moveToTrash(client, confirm.ids, actorLabel)
        const failed = results.filter((r) => !r.ok)
        toast.push({
          status: failed.length ? 'warning' : 'success',
          title: failed.length
            ? `Moved ${results.length - failed.length} to Trash (${failed.length} failed)`
            : `Moved ${results.length} item${results.length === 1 ? '' : 's'} to Trash`,
          description: failed[0]?.error,
        })
      } else if (confirm.kind === 'delete' || confirm.kind === 'empty') {
        const results = await permanentlyDelete(
          client,
          confirm.ids,
          confirm.hints || hintsForIds(confirm.ids),
        )
        const failed = results.filter((r) => !r.ok)
        toast.push({
          status: failed.length ? 'warning' : 'success',
          title: failed.length
            ? `Deleted ${results.length - failed.length} (${failed.length} failed)`
            : `Permanently deleted ${results.length} item${results.length === 1 ? '' : 's'}`,
          description: failed[0]?.error,
        })
      } else if (confirm.kind === 'hide') {
        const results = await bulkSetPortfolioHidden(client, confirm.ids, true)
        const failed = results.filter((r) => !r.ok)
        toast.push({
          status: failed.length ? 'warning' : 'success',
          title: failed.length
            ? `Hidden ${results.length - failed.length} (${failed.length} failed)`
            : `Set ${results.length} item${results.length === 1 ? '' : 's'} to Hidden`,
          description: failed[0]?.error,
        })
      }
      setConfirm(null)
      setSelected(new Set())
      loadRows()
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'Action failed',
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy(false)
    }
  }, [actorLabel, client, confirm, hintsForIds, isAdmin, isTranslator, loadRows, toast])

  const runRestore = useCallback(async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    setBusy(true)
    try {
      const results = await restoreFromTrash(client, ids)
      const failed = results.filter((r) => !r.ok)
      const conflicts = results.flatMap((r) => r.restoredReferenceConflicts || [])
      toast.push({
        status: failed.length ? 'warning' : conflicts.length ? 'warning' : 'success',
        title: failed.length
          ? `Restored ${results.length - failed.length} (${failed.length} failed)`
          : `Restored ${results.length} item${results.length === 1 ? '' : 's'}`,
        description:
          failed[0]?.error ||
          (conflicts.length ? conflicts.slice(0, 3).join(' · ') : undefined),
      })
      setSelected(new Set())
      loadRows()
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'Restore failed',
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy(false)
    }
  }, [client, loadRows, selected, toast])

  // Translators translate existing docs — never create. Admin/Editor unchanged.
  const canCreate = section.canCreate !== false && !inTrash && !isTranslator
  const colSpan = section.columns.length + (supportsTrash ? 1 : 0)

  // Keep columns readable on narrow viewports: the table never shrinks below
  // the sum of its column widths; the wrapping Card scrolls horizontally.
  const tableMinWidth = useMemo(() => {
    const checkboxWidth = supportsTrash ? 44 : 0
    return (
      checkboxWidth +
      section.columns.reduce((sum, col) => {
        const parsed = parseInt(col.width ?? col.minWidth ?? '', 10)
        return sum + (Number.isNaN(parsed) ? 160 : parsed)
      }, 0)
    )
  }, [section.columns, supportsTrash])

  const impactLines = useMemo(() => {
    if (!confirm?.preflight) return [] as Array<{title: string; impacts: InboundReferenceImpact[]}>
    return confirm.preflight
      .filter((item) => item.impacts.length > 0)
      .map((item) => ({
        title: item.inventory.title,
        impacts: item.impacts,
      }))
  }, [confirm])

  // Singletons open via ContentTool navigation; this is only a brief fallback
  // while the router redirects to the document editor.
  if (section.singletonId) {
    return (
      <Flex align="center" justify="center" padding={5} style={{height: '100%'}}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Stack
      space={4}
      padding={4}
      style={{
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
    >
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Stack space={2}>
          <Text size={3} weight="semibold">
            {inTrash ? `${section.title} · Trash` : section.title}
          </Text>
          <Text size={1} muted>
            {loading
              ? 'Loading…'
              : `${filtered.length} item${filtered.length === 1 ? '' : 's'}`}
          </Text>
          {supportsStatusFilter ? (
            <Flex gap={3} align="center" wrap="wrap">
              {statusFilterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    color:
                      statusFilter === tab.id
                        ? 'var(--card-fg-color)'
                        : 'var(--card-muted-fg-color)',
                    fontWeight: statusFilter === tab.id ? 600 : 400,
                    fontSize: 13,
                  }}
                >
                  {tab.label} ({statusCounts[tab.id]})
                </button>
              ))}
              {supportsTrash ? (
                <button
                  type="button"
                  onClick={() => setStatusFilter('trash')}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    color: inTrash ? '#ef4444' : '#f87171',
                    fontWeight: inTrash ? 600 : 400,
                    fontSize: 13,
                  }}
                >
                  Trash ({trashCount})
                </button>
              ) : null}
            </Flex>
          ) : supportsTrash ? (
            <Flex gap={3} align="center">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  color: !inTrash
                    ? 'var(--card-fg-color)'
                    : 'var(--card-muted-fg-color)',
                  fontWeight: !inTrash ? 600 : 400,
                  fontSize: 13,
                }}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('trash')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  color: inTrash ? '#ef4444' : '#f87171',
                  fontWeight: inTrash ? 600 : 400,
                  fontSize: 13,
                }}
              >
                Trash ({trashCount})
              </button>
            </Flex>
          ) : null}
          {isCrewMembersSection ? (
            <Stack space={2}>
              <Flex gap={3} align="center" wrap="wrap">
                <button
                  type="button"
                  onClick={() => {
                    setCrewDeptTab('all')
                    setCrewRoleFilter('all')
                  }}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    color:
                      crewDeptTab === 'all'
                        ? 'var(--card-fg-color)'
                        : 'var(--card-muted-fg-color)',
                    fontWeight: crewDeptTab === 'all' ? 600 : 400,
                    fontSize: 13,
                  }}
                >
                  All ({crewDeptCounts.all})
                </button>
                {CREW_DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.key}
                    type="button"
                    onClick={() => {
                      setCrewDeptTab(dept.key)
                      setCrewRoleFilter('all')
                    }}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      color:
                        crewDeptTab === dept.key
                          ? 'var(--card-fg-color)'
                          : 'var(--card-muted-fg-color)',
                      fontWeight: crewDeptTab === dept.key ? 600 : 400,
                      fontSize: 13,
                    }}
                  >
                    {dept.label} ({crewDeptCounts[dept.key]})
                  </button>
                ))}
              </Flex>
              {!showCrewNotLinkedState ? (
                <Flex gap={2} align="center" wrap="wrap">
                  <MenuButton
                    id={`${section.id}-crew-role-filter`}
                    button={
                      <Button
                        text={
                          crewRoleFilter === 'all'
                            ? `Filter by role… (${crewRoleCounts.all ?? 0})`
                            : `${crewRoleTabLabel(crewRoleFilter)} (${crewRoleCounts[crewRoleFilter] ?? 0})`
                        }
                        icon={FilterIcon}
                        iconRight={ChevronDownIcon}
                        mode="ghost"
                        fontSize={1}
                      />
                    }
                    menu={
                      <Menu>
                        <MenuItem
                          text={`All roles (${crewRoleCounts.all ?? 0})`}
                          pressed={crewRoleFilter === 'all'}
                          onClick={() => setCrewRoleFilter('all')}
                        />
                        {crewDeptTab === 'all'
                          ? CREW_DEPARTMENTS.filter((dept) =>
                              deptHasLinkedRoles(dept.key),
                            ).map((dept) => (
                              <MenuGroup key={dept.key} text={dept.label}>
                                {LINKED_DEPT_ROLE_KEYS[dept.key].map((roleKey) => (
                                  <MenuItem
                                    key={roleKey}
                                    text={`${crewRoleTabLabel(roleKey)} (${crewRoleCounts[roleKey] ?? 0})`}
                                    pressed={crewRoleFilter === roleKey}
                                    onClick={() => setCrewRoleFilter(roleKey)}
                                  />
                                ))}
                              </MenuGroup>
                            ))
                          : linkedRolesInScope.map((roleKey) => (
                              <MenuItem
                                key={roleKey}
                                text={`${crewRoleTabLabel(roleKey)} (${crewRoleCounts[roleKey] ?? 0})`}
                                pressed={crewRoleFilter === roleKey}
                                onClick={() => setCrewRoleFilter(roleKey)}
                              />
                            ))}
                      </Menu>
                    }
                    popover={{portal: true, placement: 'bottom-start'}}
                  />
                </Flex>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
        <Flex gap={2} align="center" wrap="wrap">
          {isCrewMembersSection &&
          !showCrewNotLinkedState &&
          crewRoleFilter !== 'all' ? (
            <Button
              mode="ghost"
              tone="primary"
              fontSize={1}
              padding={2}
              iconRight={CloseIcon}
              text={`${crewRoleTabLabel(crewRoleFilter)} (${crewRoleCounts[crewRoleFilter] ?? 0})`}
              title="Clear role filter"
              onClick={() => setCrewRoleFilter('all')}
            />
          ) : null}
          {(canMoveToTrash || canBulkHide) && selected.size > 0 ? (
            !inTrash ? (
              <MenuButton
                id={`${section.id}-bulk-actions`}
                button={
                  <Button
                    text={`Bulk Actions (${selected.size})`}
                    iconRight={ChevronDownIcon}
                    mode="ghost"
                    disabled={busy}
                  />
                }
                menu={
                  <Menu>
                    {canBulkHide ? (
                      <MenuItem
                        icon={EyeClosedIcon}
                        text="Set to Hidden"
                        disabled={busy}
                        onClick={openHideConfirm}
                      />
                    ) : null}
                    {canMoveToTrash ? (
                      <MenuItem
                        icon={TrashIcon}
                        text="Move to Trash"
                        tone="critical"
                        disabled={busy}
                        onClick={openTrashConfirm}
                      />
                    ) : null}
                  </Menu>
                }
              />
            ) : canPermanentlyDelete ? (
              <Flex gap={2}>
                <Button
                  text="Restore"
                  mode="ghost"
                  disabled={busy}
                  onClick={runRestore}
                />
                <Button
                  text="Delete permanently"
                  tone="critical"
                  mode="ghost"
                  disabled={busy}
                  onClick={() =>
                    setConfirm({kind: 'delete', ids: [...selected]})
                  }
                />
              </Flex>
            ) : (
              <Button
                text="Restore"
                mode="ghost"
                disabled={busy}
                onClick={runRestore}
              />
            )
          ) : null}
          {canPermanentlyDelete && inTrash ? (
            <Button
              text="Empty Trash"
              tone="critical"
              mode="bleed"
              disabled={busy || trashCount === 0}
              onClick={() =>
                setConfirm({
                  kind: 'empty',
                  ids: rows.filter((row) => row.isTrashed).map((row) => row._id),
                })
              }
            />
          ) : null}
          <Box style={{minWidth: 220}}>
            <TextInput
              icon={SearchIcon}
              placeholder="Search…"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Box>
          {canCreate ? (
            <Button
              icon={AddIcon}
              text={section.createLabel || `New ${section.title}`}
              tone="primary"
              mode="ghost"
              onClick={onCreateDocument}
            />
          ) : null}
        </Flex>
      </Flex>

      {loading ? (
        <Flex align="center" gap={2} paddingY={5}>
          <Spinner />
          <Text size={1} muted>
            Loading documents…
          </Text>
        </Flex>
      ) : null}

      {error ? (
        <Card padding={3} tone="critical" radius={2}>
          <Text size={1}>{error}</Text>
        </Card>
      ) : null}

      {!loading && !error && showCrewNotLinkedState ? (
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              {CREW_DEPARTMENTS.find((dept) => dept.key === crewDeptTab)?.label ?? crewDeptTab}{' '}
              — not linked yet
            </Text>
            <Text size={1} muted>
              Crew credits in this department are still plain names on portfolio entries — no{' '}
              creditIdentity links exist yet. Identity linking for this department will be enabled
              after a dedicated migration apply (same process as Stills).
            </Text>
          </Stack>
        </Card>
      ) : null}

      {!loading && !error && !showCrewNotLinkedState ? (
        <Card radius={2} shadow={1} style={{overflowX: 'auto'}}>
          <table
            style={{
              width: '100%',
              minWidth: tableMinWidth,
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr>
                {supportsTrash ? (
                  <th
                    style={{
                      width: 44,
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--card-border-color)',
                    }}
                  >
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={
                        !allVisibleSelected &&
                        filtered.some((row) => selected.has(row._id))
                      }
                      onChange={toggleAllVisible}
                    />
                  </th>
                ) : null}
                {section.columns.map((col) => (
                  <th
                    key={col.id}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--card-border-color)',
                      width: col.width,
                      cursor: col.sortable ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={col.sortable ? () => toggleSort(col.id) : undefined}
                  >
                    <Text size={0} weight="semibold" muted>
                      {col.header}
                      {col.sortable && sort.field === col.id
                        ? sort.direction === 'asc'
                          ? ' ↑'
                          : ' ↓'
                        : ''}
                    </Text>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} style={{padding: 24}}>
                    <Text size={1} muted>
                      {inTrash
                        ? 'Trash is empty.'
                        : statusFilter !== 'all'
                          ? `No ${STATUS_LABELS[statusFilter].toLowerCase()} items.`
                          : 'No documents found.'}
                    </Text>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  return (
                    <tr
                      key={row._id}
                      style={{cursor: 'pointer'}}
                      onClick={() =>
                        onOpenDocument(baseId(row._id), row._type, row.title)
                      }
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background =
                          'var(--card-hovered-bg-color)'
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {supportsTrash ? (
                        <td
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid var(--card-border-color)',
                            verticalAlign: 'middle',
                          }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Checkbox
                            checked={selected.has(row._id)}
                            onChange={() => toggleRow(row._id)}
                          />
                        </td>
                      ) : null}
                      {section.columns.map((col) => (
                        <td
                          key={col.id}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid var(--card-border-color)',
                            verticalAlign: 'middle',
                            overflow: 'hidden',
                          }}
                        >
                          {col.id === 'title' && inTrash ? (
                            <Stack space={1}>
                              <CellContent
                                columnId={col.id}
                                row={row}
                                crewRoleFilter={crewRoleFilter}
                              />
                              <Text size={0} muted>
                                Purges {formatDate(row.purgeAfter)}
                              </Text>
                            </Stack>
                          ) : (
                            <CellContent
                              columnId={col.id}
                              row={row}
                              crewRoleFilter={crewRoleFilter}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </Card>
      ) : null}

      {confirm ? (
        <Dialog
          id="content-bulk-confirm"
          header={
            confirm.kind === 'trash'
              ? 'Move to Trash'
              : confirm.kind === 'hide'
                ? 'Set to Hidden'
                : confirm.kind === 'empty'
                  ? 'Empty Trash'
                  : 'Delete permanently'
          }
          width={1}
          onClose={() => {
            if (!busy) setConfirm(null)
          }}
        >
          <Stack space={4} padding={4}>
            {confirm.kind === 'hide' ? (
              <Text size={1}>
                Set {confirm.ids.length} portfolio item
                {confirm.ids.length === 1 ? '' : 's'} to Hidden? Hidden items
                are excluded from the public /work/ portfolio and market
                archives. You can unhide them from the document editor.
              </Text>
            ) : confirm.kind === 'trash' ? (
              <>
                <Text size={1}>
                  Move {confirm.ids.length} item
                  {confirm.ids.length === 1 ? '' : 's'} to Trash? Items stay
                  recoverable for 30 days, then are permanently deleted.
                </Text>
                {impactLines.length > 0 ? (
                  <Card padding={3} radius={2} tone="caution">
                    <Stack space={3}>
                      <Text size={1} weight="semibold">
                        These items are referenced elsewhere. Trashing them will
                        remove those placements from galleries/pages:
                      </Text>
                      {impactLines.map((line) => (
                        <Stack key={line.title} space={2}>
                          <Text size={1} weight="semibold">
                            {line.title}
                          </Text>
                          <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
                            {formatImpactSummary(line.impacts)}
                          </Text>
                        </Stack>
                      ))}
                    </Stack>
                  </Card>
                ) : (
                  <Text size={1} muted>
                    No inbound references found.
                  </Text>
                )}
              </>
            ) : (
              <Text size={1}>
                {confirm.kind === 'empty'
                  ? `Permanently delete all ${confirm.ids.length} item${confirm.ids.length === 1 ? '' : 's'} in Trash? This cannot be undone.`
                  : `Permanently delete ${confirm.ids.length} selected item${confirm.ids.length === 1 ? '' : 's'}? This clears any leftover scheduled release versions and cannot be undone.`}
              </Text>
            )}
            <Flex justify="flex-end" gap={2}>
              <Button
                mode="bleed"
                text="Cancel"
                disabled={busy}
                onClick={() => setConfirm(null)}
              />
              <Button
                tone={confirm.kind === 'hide' ? 'default' : 'critical'}
                text={
                  busy
                    ? 'Working…'
                    : confirm.kind === 'trash'
                      ? 'Move to Trash'
                      : confirm.kind === 'hide'
                        ? 'Set to Hidden'
                        : 'Delete permanently'
                }
                disabled={busy}
                onClick={runConfirm}
              />
            </Flex>
          </Stack>
        </Dialog>
      ) : null}
    </Stack>
  )
}
