/**
 * Compact card grid for the internal work library.
 * Full-bleed poster cards with optional title/date overlay.
 */

'use client';

import Image from 'next/image';
import {urlForImage} from '@/lib/sanity';
import type {Locale} from '@/i18n/routing';
import type {InternalLibraryEntry} from '@/types/sanity';
import {formatPublishDate, getDisplayTitle} from './text';
import {WorkInternalItemMenu} from './WorkInternalItemMenu';
import {WorkInternalSelectCheckbox} from './WorkInternalSelectCheckbox';

interface WorkInternalCardViewProps {
  entries: InternalLibraryEntry[];
  locale: Locale;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, selected: boolean) => void;
  onOpenQuickView: (id: string) => void;
}

export function WorkInternalCardView({
  entries,
  locale,
  selectedIds,
  onToggleSelect,
  onOpenQuickView,
}: WorkInternalCardViewProps) {
  return (
    <div className="vp-internal-cards" role="list">
      {entries.map((entry) => {
        const imageUrl = urlForImage(entry.featuredImage)
          .width(640)
          .height(360)
          .fit('crop')
          .url();
        const title = getDisplayTitle(entry, locale);
        const selected = selectedIds.has(entry._id);

        return (
          <div
            key={entry._id}
            role="listitem"
            className={
              selected
                ? 'vp-internal-card is-selected'
                : 'vp-internal-card'
            }
          >
            <WorkInternalSelectCheckbox
              checked={selected}
              label={`Select ${title}`}
              onChange={(checked) => onToggleSelect(entry._id, checked)}
            />
            <WorkInternalItemMenu
              entry={entry}
              locale={locale}
              onQuickView={() => onOpenQuickView(entry._id)}
            />
            <button
              type="button"
              className="vp-internal-card__hit"
              onClick={() => onOpenQuickView(entry._id)}
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
                <div className="vp-internal-card__overlay">
                  <h2 className="vp-internal-card__title">{title}</h2>
                  <p className="vp-internal-card__date">
                    {formatPublishDate(entry.publishedAt)}
                  </p>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
