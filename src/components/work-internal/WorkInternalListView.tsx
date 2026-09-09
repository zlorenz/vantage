/**
 * Dense list/table view for the internal work library.
 */

'use client';

import Image from 'next/image';
import {urlForImage} from '@/lib/sanity';
import type {Locale} from '@/i18n/routing';
import type {InternalLibraryEntry} from '@/types/sanity';
import {
  getArtName,
  getCrewName,
  getEditorName,
  getPrimaryClientName,
} from './filter-entries';
import {formatPublishDate, getDisplayTitle} from './text';
import type {LibrarySort} from './types';
import {WorkInternalItemMenu} from './WorkInternalItemMenu';
import {WorkInternalSelectCheckbox} from './WorkInternalSelectCheckbox';

type SortColumn = 'title' | 'date' | 'client';

interface WorkInternalListViewProps {
  entries: InternalLibraryEntry[];
  locale: Locale;
  sort: LibrarySort;
  onSortChange: (sort: LibrarySort) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, selected: boolean) => void;
  onOpenQuickView: (id: string) => void;
}

function sortColumnFor(sort: LibrarySort): SortColumn {
  if (sort.startsWith('title-')) return 'title';
  if (sort.startsWith('client-')) return 'client';
  return 'date';
}

function sortDirection(sort: LibrarySort): 'asc' | 'desc' {
  return sort.endsWith('-asc') ? 'asc' : 'desc';
}

/** Default when switching to a column that isn't currently active. */
function defaultSortForColumn(column: SortColumn): LibrarySort {
  switch (column) {
    case 'title':
      return 'title-asc';
    case 'client':
      return 'client-asc';
    case 'date':
    default:
      return 'publishedAt-desc';
  }
}

function toggledSort(sort: LibrarySort, column: SortColumn): LibrarySort {
  if (sortColumnFor(sort) !== column) return defaultSortForColumn(column);

  switch (column) {
    case 'title':
      return sort === 'title-asc' ? 'title-desc' : 'title-asc';
    case 'client':
      return sort === 'client-asc' ? 'client-desc' : 'client-asc';
    case 'date':
      return sort === 'publishedAt-desc'
        ? 'publishedAt-asc'
        : 'publishedAt-desc';
  }
}

interface SortableHeaderProps {
  label: string;
  column: SortColumn;
  sort: LibrarySort;
  onSortChange: (sort: LibrarySort) => void;
}

function SortableHeader({
  label,
  column,
  sort,
  onSortChange,
}: SortableHeaderProps) {
  const active = sortColumnFor(sort) === column;
  const direction = sortDirection(sort);
  const next = toggledSort(sort, column);
  const ariaSort = active
    ? direction === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none';

  return (
    <span role="columnheader" aria-sort={ariaSort}>
      <button
        type="button"
        className={
          active
            ? 'vp-internal-list__sort-btn is-active'
            : 'vp-internal-list__sort-btn'
        }
        onClick={(event) => {
          // Header sits above rows, but stopPropagation keeps any future
          // parent listeners from treating this as a row/select action.
          event.preventDefault();
          event.stopPropagation();
          onSortChange(next);
        }}
      >
        <span>{label}</span>
        <span className="vp-internal-list__sort-ind" aria-hidden="true">
          {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </span>
  );
}

export function WorkInternalListView({
  entries,
  locale,
  sort,
  onSortChange,
  selectedIds,
  onToggleSelect,
  onOpenQuickView,
}: WorkInternalListViewProps) {
  return (
    <div className="vp-internal-list" role="table" aria-label="Portfolio library">
      <div className="vp-internal-list__head" role="row">
        <span role="columnheader" className="vp-internal-list__select-col">
          <span className="sr-only">Select</span>
        </span>
        <span role="columnheader" className="vp-internal-list__thumb-col" />
        <SortableHeader
          label="Title"
          column="title"
          sort={sort}
          onSortChange={onSortChange}
        />
        <SortableHeader
          label="Client"
          column="client"
          sort={sort}
          onSortChange={onSortChange}
        />
        <SortableHeader
          label="Date"
          column="date"
          sort={sort}
          onSortChange={onSortChange}
        />
        <span role="columnheader">Dir</span>
        <span role="columnheader">DOP</span>
        <span role="columnheader">ART</span>
        <span role="columnheader">EDIT</span>
        <span role="columnheader">Status</span>
      </div>
      {entries.map((entry) => {
        const imageUrl = urlForImage(entry.featuredImage)
          .width(160)
          .height(90)
          .fit('crop')
          .url();
        const title = getDisplayTitle(entry, locale);
        const selected = selectedIds.has(entry._id);

        return (
          <div
            key={entry._id}
            role="row"
            className={
              selected
                ? 'vp-internal-list__row is-selected'
                : 'vp-internal-list__row'
            }
          >
            <span className="vp-internal-list__select-col" role="cell">
              <WorkInternalSelectCheckbox
                checked={selected}
                label={`Select ${title}`}
                onChange={(checked) => onToggleSelect(entry._id, checked)}
              />
            </span>
            <WorkInternalItemMenu
              entry={entry}
              locale={locale}
              onQuickView={() => onOpenQuickView(entry._id)}
            />
            <button
              type="button"
              className="vp-internal-list__hit"
              onClick={() => onOpenQuickView(entry._id)}
            >
              <span className="vp-internal-list__thumb-col" role="cell">
                <span className="vp-internal-list__thumb">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </span>
              </span>
              <span role="cell" className="vp-internal-list__title">
                {title}
              </span>
              <span role="cell" className="vp-internal-list__client">
                {getPrimaryClientName(entry)}
              </span>
              <span role="cell">{formatPublishDate(entry.publishedAt)}</span>
              <span role="cell">{getCrewName(entry, 'director')}</span>
              <span role="cell">{getCrewName(entry, 'dop')}</span>
              <span role="cell">{getArtName(entry)}</span>
              <span role="cell">{getEditorName(entry)}</span>
              <span role="cell">
                {entry.isHidden ? (
                  <span className="vp-internal-badge vp-internal-badge--hidden">
                    Hidden
                  </span>
                ) : (
                  <span className="vp-internal-badge vp-internal-badge--public">
                    Public
                  </span>
                )}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
