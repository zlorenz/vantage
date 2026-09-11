/**
 * ShowreelEditor — password-gated utility editor for a showreel document.
 *
 * Item mutations update local order immediately, then debounced-PATCH the full
 * ordered `portfolioItemIds` list on `/api/showreel/[id]`. Reorder uses
 * up/down buttons — @dnd-kit is only a Sanity transitive dep, not used in
 * the Next app.
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
  type CSSProperties,
  type FormEvent,
} from 'react'
import {useRouter} from '@/i18n/navigation'
import {workInternalLibraryHref} from '@/lib/internal-app-paths'
import {urlForImage} from '@/lib/sanity'
import type {Locale} from '@/i18n/routing'
import {showreelLoginPathFor} from '@/lib/showreel-auth-paths'
import {showreelPublicPath} from '@/lib/showreel-urls'
import type {InternalLibraryEntry} from '@/types/sanity'
import {buildSearchTextByEntryId} from '@/components/work-internal/filter-entries'
import {getDisplayTitle} from '@/components/work-internal/text'
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

function viewTransitionNameFor(id: string): string {
  return `vp-showreel-row-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

function runWithOptionalViewTransition(update: () => void) {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => unknown
  }
  if (!reduceMotion && typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(update)
    return
  }
  update()
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
  const [movedItemId, setMovedItemId] = useState<string | null>(null)
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
  const movedClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const publicPath = showreelPublicPath(showreel._id, locale)
  const destructiveBusy = savingFields || itemsSaving || deleting

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    setPublicUrl(`${window.location.origin}${publicPath}`)
  }, [publicPath])

  useEffect(() => {
    return () => {
      if (movedClearTimerRef.current) clearTimeout(movedClearTimerRef.current)
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

  function commitItemsLocally(
    nextItems: ShowreelEditorItem[],
    options?: {movedId?: string; animate?: boolean},
  ) {
    if (nextItems.length < 1) {
      setItemsError('A showreel needs at least one portfolio item.')
      return
    }

    persistEpochRef.current += 1

    const apply = () => {
      itemsRef.current = nextItems
      setItems(nextItems)
    }

    if (options?.animate) {
      runWithOptionalViewTransition(apply)
    } else {
      apply()
    }

    if (options?.movedId) {
      setMovedItemId(options.movedId)
      if (movedClearTimerRef.current) clearTimeout(movedClearTimerRef.current)
      movedClearTimerRef.current = setTimeout(() => {
        setMovedItemId((current) =>
          current === options.movedId ? null : current,
        )
      }, 280)
    }

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

  function moveItem(index: number, delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [row] = next.splice(index, 1)
    next.splice(target, 0, row)
    commitItemsLocally(next, {movedId: row._id, animate: true})
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
      router.replace(workInternalLibraryHref())
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
      <header className="vp-showreel-editor__header">
        <h1 className="vp-internal-app__title">Showreel editor</h1>
        <p className="vp-showreel-editor__id">
          <code>{showreel._id}</code>
        </p>
      </header>

      <section
        className="vp-showreel-editor__share"
        aria-label="Public showreel link"
      >
        <span className="vp-internal-filter__label">Public URL</span>
        <div className="vp-showreel-editor__share-row">
          <input
            className="vp-internal-search__input"
            readOnly
            value={publicUrl}
            aria-label="Public showreel URL"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className="vp-internal-showreel-bar__create"
            onClick={copyPublicUrl}
          >
            {copyState === 'copied'
              ? 'Copied'
              : copyState === 'failed'
                ? 'Copy failed'
                : 'Copy'}
          </button>
        </div>
        <p className="vp-showreel-editor__hint">
          Share this link with the client. The public page may still be a stub.
        </p>
      </section>

      <form className="vp-showreel-editor__fields" onSubmit={onSaveFields}>
        <label className="vp-showreel-editor__field">
          <span className="vp-internal-filter__label">Title</span>
          <input
            type="text"
            className="vp-internal-search__input"
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
            {savingFields ? 'Saving…' : 'Save details'}
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
        <ul className="vp-showreel-editor__list">
          {items.map((item, index) => {
            const titleText = getDisplayTitle(
              item as InternalLibraryEntry,
              locale,
            )
            const imageUrl = item.featuredImage
              ? urlForImage(item.featuredImage)
                  .width(160)
                  .height(90)
                  .fit('crop')
                  .url()
              : null
            return (
              <li
                key={item._id}
                className={
                  movedItemId === item._id
                    ? 'vp-showreel-editor__row is-moved'
                    : 'vp-showreel-editor__row'
                }
                style={
                  {
                    viewTransitionName: viewTransitionNameFor(item._id),
                  } as CSSProperties
                }
              >
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
                <span className="vp-showreel-editor__row-title">{titleText}</span>
                <div className="vp-showreel-editor__row-actions">
                  <button
                    type="button"
                    className="vp-showreel-editor__icon-btn"
                    aria-label="Move up"
                    disabled={deleting || index === 0}
                    onClick={() => moveItem(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="vp-showreel-editor__icon-btn"
                    aria-label="Move down"
                    disabled={deleting || index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="vp-internal-clear"
                    disabled={deleting || items.length <= 1}
                    onClick={() => removeItem(item._id)}
                    title={
                      items.length <= 1
                        ? 'At least one item is required'
                        : 'Remove'
                    }
                  >
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
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
