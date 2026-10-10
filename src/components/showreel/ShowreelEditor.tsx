/**
 * ShowreelEditor — password-gated utility editor for a showreel document.
 *
 * Item mutations update local order immediately, then debounced-PATCH the full
 * ordered `portfolioItemIds` list on `/api/showreel/[id]`. Reorder uses
 * @dnd-kit drag-and-drop (pointer + keyboard).
 */

'use client'

import Image from 'next/image'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {useRouter} from 'next/navigation'
import {workInternalLibraryBrowserPath} from '@/lib/internal-app-paths'
import {urlForImage} from '@/lib/sanity'
import {getSiteOrigin} from '@/lib/site-hosts'
import type {Locale} from '@/i18n/routing'
import {showreelLoginPathFor} from '@/lib/showreel-auth-paths'
import {showreelPublicPath} from '@/lib/showreel-urls'
import type {InternalLibraryEntry} from '@/types/sanity'
import {buildSearchTextByEntryId} from '@/components/work-internal/filter-entries'
import {getDisplayTitle, getDisplayTitleParts} from '@/components/work-internal/text'
import {ShowreelItemPicker} from './ShowreelItemPicker'

const ITEMS_PERSIST_DEBOUNCE_MS = 450

export type ShowreelEditorItem = {
  _id: string
  title: string
  titleZh?: string
  displayTitleParts?: InternalLibraryEntry['displayTitleParts']
  featuredImage?: InternalLibraryEntry['featuredImage']
  slug?: string
  slugZh?: string
}

export type ShowreelEditorData = {
  _id: string
  title: string
  description?: string
  items: ShowreelEditorItem[]
}

interface ShowreelEditorProps {
  locale: Locale
  showreel: ShowreelEditorData
  library: InternalLibraryEntry[]
}

function itemOrderKey(list: ShowreelEditorItem[]): string {
  return list.map((item) => item._id).join('\0')
}

function DragHandleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zM9 17h2v2H9v-2zm4 0h2v2h-2v-2z"
      />
    </svg>
  )
}

function SortableShowreelRow({
  item,
  locale,
  disabled,
  canRemove,
  onRemove,
}: {
  item: ShowreelEditorItem
  locale: Locale
  disabled: boolean
  canRemove: boolean
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: item._id, disabled})

  const titleText = getDisplayTitle(item as InternalLibraryEntry, locale)
  const {brandLine, campaignLine} = getDisplayTitleParts(
    item as InternalLibraryEntry,
    locale,
  )
  const campaignText = campaignLine || titleText
  const imageUrl = item.featuredImage
    ? urlForImage(item.featuredImage).width(160).height(90).fit('crop').url()
    : null

  return (
    <li
      ref={setNodeRef}
      className={
        isDragging
          ? 'vp-showreel-editor__row is-dragging'
          : 'vp-showreel-editor__row'
      }
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="vp-showreel-editor__drag-handle"
        aria-label={`Reorder ${campaignText}`}
        title="Drag to reorder"
        disabled={disabled}
        {...listeners}
        {...attributes}
      >
        <DragHandleIcon />
      </button>
      <span className="vp-showreel-editor__thumb">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </span>
      <span className="vp-showreel-editor__row-title">
        {brandLine ? (
          <span className="vp-internal-list__brand">{brandLine}</span>
        ) : null}
        <span className="vp-internal-list__campaign">{campaignText}</span>
      </span>
      <div className="vp-showreel-editor__row-actions">
        <button
          type="button"
          className="vp-showreel-editor__remove-btn"
          aria-label="Remove"
          disabled={disabled || !canRemove}
          onClick={() => onRemove(item._id)}
          title={canRemove ? 'Remove' : 'At least one item is required'}
        >
          ×
        </button>
      </div>
    </li>
  )
}

async function patchShowreel(
  id: string,
  body: Record<string, unknown>,
): Promise<{ok: true} | {ok: false; error: string}> {
  try {
    const res = await fetch(`/api/showreel/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => null)) as {
      error?: string
    } | null
    if (res.status === 401) {
      const {pathname, search} = window.location
      const login = showreelLoginPathFor(pathname)
      window.location.assign(
        `${login}?next=${encodeURIComponent(`${pathname}${search}`)}`,
      )
      return {ok: false, error: 'Unauthorized'}
    }
    if (res.status === 404) {
      return {
        ok: false,
        error: 'This showreel no longer exists (it may have been deleted).',
      }
    }
    if (!res.ok) {
      return {ok: false, error: data?.error || 'Save failed'}
    }
    return {ok: true}
  } catch {
    return {ok: false, error: 'Save failed'}
  }
}

async function deleteShowreel(
  id: string,
): Promise<{ok: true} | {ok: false; error: string}> {
  try {
    const res = await fetch(`/api/showreel/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    const data = (await res.json().catch(() => null)) as {
      error?: string
    } | null
    if (res.status === 401) {
      const {pathname, search} = window.location
      const login = showreelLoginPathFor(pathname)
      window.location.assign(
        `${login}?next=${encodeURIComponent(`${pathname}${search}`)}`,
      )
      return {ok: false, error: 'Unauthorized'}
    }
    if (res.status === 404) {
      return {
        ok: false,
        error: 'This showreel was already deleted.',
      }
    }
    if (!res.ok) {
      return {ok: false, error: data?.error || 'Delete failed'}
    }
    return {ok: true}
  } catch {
    return {ok: false, error: 'Delete failed'}
  }
}

export function ShowreelEditor({
  locale,
  showreel,
  library,
}: ShowreelEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(showreel.title)
  const [description, setDescription] = useState(showreel.description ?? '')
  const [savedTitle, setSavedTitle] = useState(showreel.title)
  const [savedDescription, setSavedDescription] = useState(
    showreel.description ?? '',
  )
  const [items, setItems] = useState<ShowreelEditorItem[]>(() =>
    showreel.items.filter((item): item is ShowreelEditorItem =>
      Boolean(item?._id),
    ),
  )
  const [fieldsError, setFieldsError] = useState<string | null>(null)
  const [fieldsSaved, setFieldsSaved] = useState(false)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [itemsSaving, setItemsSaving] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )
  const [publicUrl, setPublicUrl] = useState(() =>
    showreelPublicPath(showreel._id, locale),
  )
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [savingFields, startSaveFields] = useTransition()
  const [deleting, startDeleting] = useTransition()
  const deleteDialogTitleId = useId()

  const itemsRef = useRef(items)
  const savedItemsRef = useRef(items)
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistEpochRef = useRef(0)

  const publicPath = showreelPublicPath(showreel._id, locale)
  const destructiveBusy = savingFields || itemsSaving || deleting

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {distance: 6},
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const itemIds = useMemo(() => items.map((item) => item._id), [items])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    // Public share page lives on the marketing host, not the app subdomain.
    setPublicUrl(`${getSiteOrigin()}${publicPath}`)
  }, [publicPath])

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
      const snapshot = itemsRef.current
      if (itemOrderKey(snapshot) === itemOrderKey(savedItemsRef.current)) return
      void patchShowreel(showreel._id, {
        portfolioItemIds: snapshot.map((item) => item._id),
      })
    }
  }, [showreel._id])

  const libraryById = useMemo(() => {
    const map = new Map<string, InternalLibraryEntry>()
    for (const entry of library) map.set(entry._id, entry)
    return map
  }, [library])

  const searchCtx = useMemo(
    () => ({searchTextByEntryId: buildSearchTextByEntryId(library)}),
    [library],
  )

  const itemIdSet = useMemo(
    () => new Set(items.map((item) => item._id)),
    [items],
  )

  const fieldsDirty =
    title.trim() !== savedTitle.trim() ||
    description.trim() !== savedDescription.trim()

  async function flushPersistItems() {
    const epoch = ++persistEpochRef.current
    const snapshot = itemsRef.current
    if (itemOrderKey(snapshot) === itemOrderKey(savedItemsRef.current)) {
      if (epoch === persistEpochRef.current) setItemsSaving(false)
      return
    }

    setItemsSaving(true)
    setItemsError(null)
    const result = await patchShowreel(showreel._id, {
      portfolioItemIds: snapshot.map((item) => item._id),
    })

    if (epoch !== persistEpochRef.current) return

    if (!result.ok) {
      setItemsSaving(false)
      setItemsError(result.error)
      // Only roll back if the UI still matches what we tried to save —
      // otherwise keep newer local edits and reschedule.
      if (itemOrderKey(itemsRef.current) === itemOrderKey(snapshot)) {
        itemsRef.current = savedItemsRef.current
        setItems(savedItemsRef.current)
      } else if (
        itemOrderKey(itemsRef.current) !== itemOrderKey(savedItemsRef.current)
      ) {
        schedulePersistItems()
      }
      return
    }

    savedItemsRef.current = snapshot
    if (itemOrderKey(itemsRef.current) !== itemOrderKey(savedItemsRef.current)) {
      void flushPersistItems()
      return
    }
    setItemsSaving(false)
  }

  function schedulePersistItems() {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null
      void flushPersistItems()
    }, ITEMS_PERSIST_DEBOUNCE_MS)
  }

  function cancelPendingItemPersist() {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current)
      persistTimerRef.current = null
    }
    persistEpochRef.current += 1
    setItemsSaving(false)
  }

  function commitItemsLocally(nextItems: ShowreelEditorItem[]) {
    if (nextItems.length < 1) {
      setItemsError('A showreel needs at least one portfolio item.')
      return
    }

    persistEpochRef.current += 1
    itemsRef.current = nextItems
    setItems(nextItems)
    setItemsError(null)
    schedulePersistItems()
  }

  function onSaveFields(event: FormEvent) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) {
      setFieldsError('Title is required')
      setFieldsSaved(false)
      return
    }
    const nextDescription = description.trim()
    setFieldsError(null)
    setFieldsSaved(false)
    startSaveFields(async () => {
      const result = await patchShowreel(showreel._id, {
        title: nextTitle,
        description: nextDescription || null,
      })
      if (!result.ok) {
        setFieldsError(result.error)
        return
      }
      setTitle(nextTitle)
      setDescription(nextDescription)
      setSavedTitle(nextTitle)
      setSavedDescription(nextDescription)
      setFieldsSaved(true)
    })
  }

  function onDragEnd(event: DragEndEvent) {
    const {active, over} = event
    if (!over || active.id === over.id || deleting) return
    const current = itemsRef.current
    const oldIndex = current.findIndex((item) => item._id === active.id)
    const newIndex = current.findIndex((item) => item._id === over.id)
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return
    commitItemsLocally(arrayMove(current, oldIndex, newIndex))
  }

  function removeItem(id: string) {
    if (items.length <= 1) {
      setItemsError('A showreel needs at least one portfolio item.')
      return
    }
    commitItemsLocally(items.filter((item) => item._id !== id))
  }

  function addItems(ids: string[]) {
    const next = [...items]
    let added = 0
    for (const id of ids) {
      if (itemIdSet.has(id)) continue
      const fromLibrary = libraryById.get(id)
      if (!fromLibrary) continue
      next.push({
        _id: fromLibrary._id,
        title: fromLibrary.title,
        titleZh: fromLibrary.titleZh,
        displayTitleParts: fromLibrary.displayTitleParts,
        featuredImage: fromLibrary.featuredImage,
        slug: fromLibrary.slug,
        slugZh: fromLibrary.slugZh,
      })
      added += 1
    }
    if (added === 0) return
    commitItemsLocally(next)
  }

  async function copyPublicUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('failed')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  function openDeleteConfirm() {
    setDeleteError(null)
    setDeleteConfirmOpen(true)
  }

  function cancelDeleteConfirm() {
    if (deleting) return
    setDeleteConfirmOpen(false)
    setDeleteError(null)
  }

  function onConfirmDelete() {
    if (deleting) return
    setDeleteError(null)
    cancelPendingItemPersist()
    startDeleting(async () => {
      const result = await deleteShowreel(showreel._id)
      if (!result.ok) {
        setDeleteError(result.error)
        return
      }
      router.replace(workInternalLibraryBrowserPath())
    })
  }

  useEffect(() => {
    if (!deleteConfirmOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !deleting) {
        setDeleteConfirmOpen(false)
        setDeleteError(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteConfirmOpen, deleting])

  return (
    <div className="vp-showreel-editor">
      <h1 className="sr-only">Showreel Editor</h1>
      <section
        className="vp-showreel-editor__share"
        aria-label="Client link"
      >
        <span className="vp-internal-filter__label">Client Link</span>
        <div className="vp-showreel-editor__share-field">
          <input
            className="vp-showreel-editor__share-input"
            readOnly
            value={publicUrl}
            aria-label="Client showreel link"
            onFocus={(e) => e.currentTarget.select()}
          />
          <a
            className="vp-showreel-editor__share-btn"
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open client link in a new tab"
            title="Open"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="currentColor"
                d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"
              />
            </svg>
          </a>
          <button
            type="button"
            className={
              copyState === 'copied'
                ? 'vp-showreel-editor__share-btn is-copied'
                : copyState === 'failed'
                  ? 'vp-showreel-editor__share-btn is-failed'
                  : 'vp-showreel-editor__share-btn'
            }
            onClick={copyPublicUrl}
            aria-label={
              copyState === 'copied'
                ? 'Copied'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy client link'
            }
            title={
              copyState === 'copied'
                ? 'Copied'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy'
            }
          >
            {copyState === 'copied' ? (
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M9.55 17.6 4.9 12.95l1.4-1.4 3.25 3.25 7.15-7.15 1.4 1.4z"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                />
              </svg>
            )}
          </button>
        </div>
      </section>

      <form className="vp-showreel-editor__fields" onSubmit={onSaveFields}>
        <label className="vp-showreel-editor__field">
          <span className="vp-internal-filter__label">Title</span>
          <input
            type="text"
            className="vp-internal-search__input vp-showreel-editor__title-input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setFieldsSaved(false)
            }}
            required
            disabled={savingFields || deleting}
          />
        </label>
        <label className="vp-showreel-editor__field">
          <span className="vp-internal-filter__label">Description</span>
          <textarea
            className="vp-internal-showreel-dialog__textarea"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setFieldsSaved(false)
            }}
            rows={4}
            disabled={savingFields || deleting}
          />
        </label>
        {fieldsError ? (
          <p className="vp-showreel-editor__error" role="alert">
            {fieldsError}
          </p>
        ) : null}
        {fieldsSaved && !fieldsDirty ? (
          <p className="vp-showreel-editor__ok" role="status">
            Saved
          </p>
        ) : null}
        <div className="vp-showreel-editor__field-actions">
          <button
            type="submit"
            className="vp-internal-showreel-bar__create"
            disabled={savingFields || deleting || !title.trim() || !fieldsDirty}
          >
            {savingFields ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      <section className="vp-showreel-editor__items" aria-label="Portfolio items">
        <div className="vp-showreel-editor__section-head">
          <h2 className="vp-showreel-editor__section-title">Items</h2>
          <span className="vp-internal-count">
            {items.length === 1 ? '1 item' : `${items.length} items`}
            {itemsSaving ? ' · Saving…' : ''}
          </span>
        </div>
        {itemsError ? (
          <p className="vp-showreel-editor__error" role="alert">
            {itemsError}
          </p>
        ) : null}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className="vp-showreel-editor__list">
              {items.map((item) => (
                <SortableShowreelRow
                  key={item._id}
                  item={item}
                  locale={locale}
                  disabled={deleting || items.length < 2}
                  canRemove={items.length > 1}
                  onRemove={removeItem}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </section>

      <ShowreelItemPicker
        locale={locale}
        library={library}
        searchCtx={searchCtx}
        excludedIds={itemIdSet}
        disabled={deleting}
        onAdd={addItems}
      />

      <section
        className="vp-showreel-editor__danger"
        aria-label="Delete showreel"
      >
        <div className="vp-showreel-editor__section-head">
          <h2 className="vp-showreel-editor__section-title">Danger zone</h2>
        </div>
        <p className="vp-showreel-editor__hint">
          Permanently delete this showreel. This cannot be undone — the public
          link will stop working immediately.
        </p>
        <button
          type="button"
          className="vp-showreel-editor__danger-btn"
          onClick={openDeleteConfirm}
          disabled={destructiveBusy}
        >
          Delete Showreel
        </button>
        {deleteError && !deleteConfirmOpen ? (
          <p className="vp-showreel-editor__error" role="alert">
            {deleteError}
          </p>
        ) : null}
      </section>

      {deleteConfirmOpen ? (
        <div
          className="vp-showreel-editor__delete-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              cancelDeleteConfirm()
            }
          }}
        >
          <div
            className="vp-showreel-editor__delete-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteDialogTitleId}
          >
            <h2
              id={deleteDialogTitleId}
              className="vp-showreel-editor__delete-title"
            >
              Delete this showreel?
            </h2>
            <p className="vp-showreel-editor__hint">
              This permanently removes the showreel. There is no recovery —
              the public link will stop working immediately.
            </p>
            {deleteError ? (
              <p className="vp-showreel-editor__error" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="vp-showreel-editor__danger-actions">
              <button
                type="button"
                className="vp-internal-clear"
                onClick={cancelDeleteConfirm}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="vp-showreel-editor__danger-btn"
                onClick={onConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
