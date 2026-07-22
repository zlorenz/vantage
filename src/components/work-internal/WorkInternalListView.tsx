/**
 * Dense list/table view for the internal work library.
 */

'use client';

import Image from 'next/image';
import { urlForImage } from '@/lib/sanity';
import type { Locale } from '@/i18n/routing';
import type { InternalLibraryEntry } from '@/types/sanity';
import { openPortfolioEntry } from './entry-url';
import { getArtName, getCrewName, getEditorName } from './filter-entries';
import { formatPublishDate, getDisplayTitle } from './text';

interface WorkInternalListViewProps {
  entries: InternalLibraryEntry[];
  locale: Locale;
}

export function WorkInternalListView({
  entries,
  locale,
}: WorkInternalListViewProps) {
  return (
    <div className="vp-internal-list" role="table" aria-label="Portfolio library">
      <div className="vp-internal-list__head" role="row">
        <span role="columnheader" className="vp-internal-list__thumb-col" />
        <span role="columnheader">Title</span>
        <span role="columnheader">Date</span>
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
        const title = getDisplayTitle(entry);

        return (
          <button
            key={entry._id}
            type="button"
            role="row"
            className="vp-internal-list__row"
            onClick={() => openPortfolioEntry(entry, locale)}
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
        );
      })}
    </div>
  );
}
