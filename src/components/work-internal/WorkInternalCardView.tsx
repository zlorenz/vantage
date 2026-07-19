/**
 * Compact card grid for the internal work library.
 */

'use client';

import Image from 'next/image';
import { urlForImage } from '@/lib/sanity';
import type { InternalLibraryEntry } from '@/types/sanity';
import { getArtName, getCrewName, getEditorName } from './filter-entries';
import { formatPublishDate, getDisplayTitle } from './text';

interface WorkInternalCardViewProps {
  entries: InternalLibraryEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function WorkInternalCardView({
  entries,
  selectedId,
  onSelect,
}: WorkInternalCardViewProps) {
  return (
    <div className="vp-internal-cards" role="list">
      {entries.map((entry) => {
        const imageUrl = urlForImage(entry.featuredImage)
          .width(640)
          .height(360)
          .fit('crop')
          .url();
        const selected = entry._id === selectedId;
        const title = getDisplayTitle(entry);

        return (
          <button
            key={entry._id}
            type="button"
            role="listitem"
            className={
              selected
                ? 'vp-internal-card is-selected'
                : 'vp-internal-card'
            }
            onClick={() => onSelect(entry._id)}
          >
            <div className="vp-internal-card__media">
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
              {entry.isHidden ? (
                <span className="vp-internal-badge vp-internal-badge--hidden">
                  Hidden
                </span>
              ) : null}
            </div>
            <div className="vp-internal-card__body">
              <h2 className="vp-internal-card__title">{title}</h2>
              <p className="vp-internal-card__date">
                {formatPublishDate(entry.publishedAt)}
              </p>
              <dl className="vp-internal-meta">
                <div>
                  <dt>Dir</dt>
                  <dd>{getCrewName(entry, 'director')}</dd>
                </div>
                <div>
                  <dt>DOP</dt>
                  <dd>{getCrewName(entry, 'dop')}</dd>
                </div>
                <div>
                  <dt>ART</dt>
                  <dd>{getArtName(entry)}</dd>
                </div>
                <div>
                  <dt>EDIT</dt>
                  <dd>{getEditorName(entry)}</dd>
                </div>
              </dl>
            </div>
          </button>
        );
      })}
    </div>
  );
}
