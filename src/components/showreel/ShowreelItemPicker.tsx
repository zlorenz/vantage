/**
 * Search + checkbox picker for adding portfolio entries to a showreel.
 * Reuses work-internal search haystacks; no full 8-filter toolbar.
 */

'use client'

import Image from 'next/image'
import {useDeferredValue, useMemo, useState} from 'react'
import {urlForImage} from '@/lib/sanity'
import type {Locale} from '@/i18n/routing'
import type {InternalLibraryEntry} from '@/types/sanity'
import type {LibraryFilterContext} from '@/components/work-internal/filter-entries'
import {getDisplayTitle, getDisplayTitleParts} from '@/components/work-internal/text'
import {WorkInternalSelectCheckbox} from '@/components/work-internal/WorkInternalSelectCheckbox'

const MAX_RESULTS = 40

interface ShowreelItemPickerProps {
  locale: Locale
  library: InternalLibraryEntry[]
  searchCtx: LibraryFilterContext
  excludedIds: Set<string>
  disabled?: boolean
  onAdd: (ids: string[]) => void
}

function matchesSearch(
  entry: InternalLibraryEntry,
  q: string,
  ctx: LibraryFilterContext,
): boolean {
  const needle = q.toLowerCase().trim()
  if (!needle) return true
  const hay = ctx.searchTextByEntryId?.get(entry._id)
  if (hay) return hay.includes(needle)
  return entry.title.toLowerCase().includes(needle)
}

export function ShowreelItemPicker({
  locale,
  library,
  searchCtx,
  excludedIds,
  disabled = false,
  onAdd,
}: ShowreelItemPickerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const deferredQuery = useDeferredValue(query)

  const candidates = useMemo(() => {
    const q = deferredQuery.trim()
    if (!q) return []
    const out: InternalLibraryEntry[] = []
    for (const entry of library) {
      if (excludedIds.has(entry._id)) continue
      if (!matchesSearch(entry, q, searchCtx)) continue
      out.push(entry)
      if (out.length >= MAX_RESULTS) break
    }
    return out
  }, [library, deferredQuery, excludedIds, searchCtx])

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function addSelected() {
    const ids = [...selected]
    if (ids.length === 0) return
    onAdd(ids)
    setSelected(new Set())
  }

  return (
    <section className="vp-showreel-editor__picker" aria-label="Add portfolio items">
      <div className="vp-showreel-editor__section-head">
        <h2 className="vp-showreel-editor__section-title">Add items</h2>
        {selected.size > 0 ? (
          <button
            type="button"
            className="vp-internal-showreel-bar__create"
            disabled={disabled}
            onClick={addSelected}
          >
            Add {selected.size} selected
          </button>
        ) : null}
      </div>

      <label className="vp-internal-search vp-showreel-editor__picker-search">
        <span className="sr-only">Search portfolio library</span>
        <input
          type="search"
          className="vp-internal-search__input"
          placeholder="Search title, client, crew…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
      </label>

      {!deferredQuery.trim() ? null : candidates.length === 0 ? (
        <p className="vp-internal-empty">No matching projects to add.</p>
      ) : (
        <ul className="vp-showreel-editor__picker-list">
          {candidates.map((entry) => {
            const title = getDisplayTitle(entry, locale)
            const {brandLine, campaignLine} = getDisplayTitleParts(entry, locale)
            const campaignText = campaignLine || title
            const checked = selected.has(entry._id)
            const imageUrl = urlForImage(entry.featuredImage)
              .width(120)
              .height(68)
              .fit('crop')
              .url()
            return (
              <li
                key={entry._id}
                className={
                  checked
                    ? 'vp-showreel-editor__picker-row is-selected'
                    : 'vp-showreel-editor__picker-row'
                }
              >
                <WorkInternalSelectCheckbox
                  checked={checked}
                  label={`Select ${title}`}
                  onChange={(next) => toggle(entry._id, next)}
                />
                <span className="vp-showreel-editor__thumb">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </span>
                <span className="vp-showreel-editor__row-title">
                  {brandLine ? (
                    <span className="vp-internal-list__brand">{brandLine}</span>
                  ) : null}
                  <span className="vp-internal-list__campaign">
                    {campaignText}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
