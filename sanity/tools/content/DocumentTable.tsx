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
  MenuItem,
  Spinner,
  Stack,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'
import {AddIcon, ChevronDownIcon, SearchIcon, TrashIcon} from '@sanity/icons'
import type {ContentLeaf, ColumnId} from './sections'
import {
  formatImpactSummary,
  moveToTrash,
  permanentlyDelete,
  preflightTrash,
  restoreFromTrash,
  type InboundReferenceImpact,
  type TrashPreflightItem,
} from './document-lifecycle'

type Row = {
  _id: string
  _type: string
  title: string
  titleZh?: string
  slug?: string
  publishedAt?: string
  updatedAt?: string
  metaDescription?: string
  focusKeyword?: string
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
}

type TableView = 'active' | 'trash'

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
      return `*[_type == "portfolioEntry" && !(_id in path("versions.**"))] | order(publishedAt desc) {
        _id,
        _type,
        title,
        titleZh,
        "slug": slug.current,
        publishedAt,
        "_updatedAt": _updatedAt,
        "metaDescription": seo.metaDescription,
        "focusKeyword": seo.focusKeyword,
        isHidden,
        trash,
        "hasDraft": count(*[_id == "drafts." + ^._id]) > 0,
        "thumbnailUrl": featuredImage.asset->url + "?w=80&h=80&fit=crop"
      }`
    case 'blogPost':
      return `*[_type == "blogPost" && !(_id in path("versions.**"))] | order(publishedAt desc) {
        _id,
        _type,
        title,
        titleZh,
        "slug": slug.current,
        publishedAt,
        "_updatedAt": _updatedAt,
        "metaDescription": seo.metaDescription,
        trash,
        "hasDraft": count(*[_id == "drafts." + ^._id]) > 0,
        "thumbnailUrl": featuredImage.asset->url + "?w=80&h=80&fit=crop",
        "categories": array::join(categories[]->title, ", ")
      }`
    case 'page':
      return `*[_type == "page" && !(_id in path("versions.**"))] | order(title asc) {
        _id,
        _type,
        title,
        titleZh,
        "slug": slug.current,
        publishedAt,
        "_updatedAt": _updatedAt,
        "metaDescription": seo.metaDescription,
        "focusKeyword": seo.focusKeyword,
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
    case 'client':
    case 'platform':
      return `*[_type == $type && !(_id in path("versions.**"))] | order(name asc) {
        _id,
        _type,
        "title": name,
        "slug": slug.current,
        "usage": count(*[references(^._id)])
      }`
    case 'crewMember':
      return `*[_type == "crewMember" && !(_id in path("versions.**"))] | order(name asc) {
        _id,
        _type,
        "title": name,
        "slug": slug.current,
        role,
        "usage": count(*[references(^._id)])
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
      title: String(doc.title ?? ''),
      titleZh: doc.titleZh ? String(doc.titleZh) : undefined,
      slug: doc.slug ? String(doc.slug) : undefined,
      publishedAt: doc.publishedAt ? String(doc.publishedAt) : undefined,
      updatedAt: doc._updatedAt ? String(doc._updatedAt) : undefined,
      metaDescription: doc.metaDescription ? String(doc.metaDescription) : undefined,
      focusKeyword: doc.focusKeyword ? String(doc.focusKeyword) : undefined,
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

function statusLabel(row: Row): string {
  if (row.isScheduled) return 'Scheduled'
  if (row.isDraftOnly) return 'Draft'
  if (row.isHidden) return 'Hidden'
  if (row.hasDraft) return 'Edited'
  return 'Published'
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

function sortValue(row: Row, field: string): string | number {
  switch (field) {
    case 'title':
      return (row.title || '').toLowerCase()
    case 'publishedAt':
      return row.isScheduled && row.scheduledFor
        ? new Date(row.scheduledFor).getTime()
        : row.publishedAt
          ? new Date(row.publishedAt).getTime()
          : 0
    case 'updatedAt':
      return row.updatedAt ? new Date(row.updatedAt).getTime() : 0
    case 'status':
      return statusLabel(row)
    case 'slug':
      return (row.slug || '').toLowerCase()
    case 'usage':
      return row.usage ?? 0
    case 'parent':
      return (row.parent || '').toLowerCase()
    case 'role':
      return (row.role || '').toLowerCase()
    default:
      return ''
  }
}

function CellContent({columnId, row}: {columnId: ColumnId; row: Row}) {
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
        <Text size={1} weight="semibold">
          {row.title || 'Untitled'}
        </Text>
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
            : formatDateTime(row.publishedAt)}
        </Text>
      )
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
    case 'focusKeyword':
      return <Text size={1}>{row.focusKeyword || '—'}</Text>
    case 'slug':
      return <Text size={1}>{row.slug || '—'}</Text>
    case 'categories':
      return <Text size={1}>{row.categories || '—'}</Text>
    case 'parent':
      return <Text size={1}>{row.parent || '—'}</Text>
    case 'usage':
      return <Text size={1}>{row.usage ?? 0}</Text>
    case 'role':
      return <Text size={1}>{ROLE_LABELS[row.role || ''] || row.role || '—'}</Text>
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
  const supportsTrash = Boolean(section.supportsTrash)

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState(section.defaultSort)
  const [view, setView] = useState<TableView>('active')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reloadKey, setReloadKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<
    | null
    | {
        kind: 'trash' | 'delete' | 'empty'
        ids: string[]
        preflight?: TrashPreflightItem[]
        hints?: Record<
          string,
          {releaseId?: string; versionId?: string; title?: string}
        >
      }
  >(null)

  useEffect(() => {
    setSort(section.defaultSort)
    setSearch('')
    setView('active')
    setSelected(new Set())
  }, [section.id, section.defaultSort])

  useEffect(() => {
    setSelected(new Set())
  }, [view])

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
      section.documentType === 'client' ||
      section.documentType === 'platform'
        ? {type: section.documentType}
        : {}

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
              "slug": slug.current,
              publishedAt,
              "_updatedAt": _updatedAt,
              "metaDescription": seo.metaDescription,
              "focusKeyword": seo.focusKeyword,
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
    ])
      .then(([docs, scheduledReleases, trashRecords]) => {
        if (cancelled) return
        const normalized = normalizeRows(docs, scheduledReleases)
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let next = rows.filter((row) =>
      supportsTrash ? (view === 'trash' ? row.isTrashed : !row.isTrashed) : true,
    )
    if (q) {
      next = next.filter((row) =>
        section.searchFields.some((field) => {
          const value =
            field === 'metaDescription'
              ? row.metaDescription
              : field === 'focusKeyword'
                ? row.focusKeyword
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
      const av = sortValue(a, sort.field)
      const bv = sortValue(b, sort.field)
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [rows, search, section.searchFields, sort, supportsTrash, view])

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
    const ids = [...selected]
    if (ids.length === 0) return
    const hints = hintsForIds(ids)

    // Any selected Active scheduled row: prefer permanent delete with known
    // release/version ids. Soft-trash inventory is unreliable for release-locked
    // ghosts left over from a partial Empty Trash.
    const allScheduledActive = ids.every((id) => {
      const row = rows.find((r) => r._id === id)
      return Boolean(row && row.isScheduled && !row.isTrashed)
    })
    if (allScheduledActive) {
      setConfirm({kind: 'delete', ids, hints})
      return
    }

    setBusy(true)
    try {
      const preflight = await preflightTrash(client, ids)
      setConfirm({kind: 'trash', ids, preflight, hints})
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Always fall back to permanent delete when inventory can't find the doc —
      // pass any release/version ids we already have from the table row.
      if (/document not found/i.test(message)) {
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
  }, [client, hintsForIds, rows, selected, toast])

  const runConfirm = useCallback(async () => {
    if (!confirm) return
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
  }, [actorLabel, client, confirm, hintsForIds, loadRows, toast])

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

  const canCreate = section.canCreate !== false && view === 'active'
  const colSpan = section.columns.length + (supportsTrash ? 1 : 0)

  const impactLines = useMemo(() => {
    if (!confirm?.preflight) return [] as Array<{title: string; impacts: InboundReferenceImpact[]}>
    return confirm.preflight
      .filter((item) => item.impacts.length > 0)
      .map((item) => ({
        title: item.inventory.title,
        impacts: item.impacts,
      }))
  }, [confirm])

  if (section.singletonId) {
    return (
      <Stack space={4} padding={4}>
        <Text size={3} weight="semibold">
          {section.title}
        </Text>
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={3}>
            <Text size={1} muted>
              Global site configuration (contact, social, default OG image).
            </Text>
            <Box>
              <Button
                text="Open Site Settings"
                tone="primary"
                onClick={() =>
                  onOpenDocument(
                    section.singletonId!,
                    section.documentType,
                    section.title,
                  )
                }
              />
            </Box>
          </Stack>
        </Card>
      </Stack>
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
            {view === 'trash' ? `${section.title} · Trash` : section.title}
          </Text>
          <Text size={1} muted>
            {loading
              ? 'Loading…'
              : `${filtered.length} item${filtered.length === 1 ? '' : 's'}`}
          </Text>
          {supportsTrash ? (
            <Flex gap={3} align="center">
              <button
                type="button"
                onClick={() => setView('active')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  color:
                    view === 'active'
                      ? 'var(--card-fg-color)'
                      : 'var(--card-muted-fg-color)',
                  fontWeight: view === 'active' ? 600 : 400,
                  fontSize: 13,
                }}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setView('trash')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  color:
                    view === 'trash'
                      ? 'var(--card-fg-color)'
                      : 'var(--card-muted-fg-color)',
                  fontWeight: view === 'trash' ? 600 : 400,
                  fontSize: 13,
                }}
              >
                Trash ({trashCount})
              </button>
            </Flex>
          ) : null}
        </Stack>
        <Flex gap={2} align="center" wrap="wrap">
          {supportsTrash && selected.size > 0 ? (
            view === 'active' ? (
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
                    <MenuItem
                      icon={TrashIcon}
                      text="Move to Trash"
                      tone="critical"
                      disabled={busy}
                      onClick={openTrashConfirm}
                    />
                  </Menu>
                }
              />
            ) : (
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
            )
          ) : null}
          {supportsTrash && view === 'trash' ? (
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

      {!loading && !error ? (
        <Card radius={2} shadow={1} overflow="auto">
          <table
            style={{
              width: '100%',
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
                      {view === 'trash' ? 'Trash is empty.' : 'No documents found.'}
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
                          {col.id === 'title' && view === 'trash' ? (
                            <Stack space={1}>
                              <CellContent columnId={col.id} row={row} />
                              <Text size={0} muted>
                                Purges {formatDate(row.purgeAfter)}
                              </Text>
                            </Stack>
                          ) : (
                            <CellContent columnId={col.id} row={row} />
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
            {confirm.kind === 'trash' ? (
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
                tone="critical"
                text={
                  busy
                    ? 'Working…'
                    : confirm.kind === 'trash'
                      ? 'Move to Trash'
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
