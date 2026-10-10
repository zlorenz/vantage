/**
 * Compact card grid for the internal work library.
 * Full-bleed poster cards with optional title/date overlay.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import {urlForImage} from '@/lib/sanity';
import type {Locale} from '@/i18n/routing';
import type {InternalLibraryEntry} from '@/types/sanity';
import {
  getWorkInternalDetailHref,
  prepareWorkInternalDetailNavigation,
} from './entry-url';
import {
  formatPublishDate,
  getDisplayTitle,
  getDisplayTitleParts,
} from './text';
import {WorkInternalCopyLinkButton} from './WorkInternalCopyLinkButton';
import {WorkInternalSelectCheckbox} from './WorkInternalSelectCheckbox';

interface WorkInternalCardViewProps {
  entries: InternalLibraryEntry[];
  locale: Locale;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, selected: boolean) => void;
  onAppHost?: boolean;
}

function HiddenEyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7ZM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27Zm5.53 5.53 1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2Zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01Z"
      />
    </svg>
  );
}

export function WorkInternalCardView({
  entries,
  locale,
  selectedIds,
  onToggleSelect,
  onAppHost = false,
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
        const {brandLine, campaignLine} = getDisplayTitleParts(entry, locale);
        // Mirror the portfolio case header: small yellow Brand/Product line
        // above the larger white Campaign line. When Brand can't compile,
        // fall back to the single-line combined `title`.
        const campaignText = campaignLine || title;
        const selected = selectedIds.has(entry._id);
        const detailHref = getWorkInternalDetailHref(entry, onAppHost);

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
            <WorkInternalCopyLinkButton entry={entry} locale={locale} />
            <Link
              href={detailHref}
              className="vp-internal-card__hit"
              onClick={() => {
                prepareWorkInternalDetailNavigation(entry, onAppHost);
              }}
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
                  <span
                    className="vp-internal-badge vp-internal-badge--hidden vp-internal-badge--icon"
                    title="Hidden"
                    aria-label="Hidden"
                  >
                    <HiddenEyeIcon />
                  </span>
                ) : null}
                <div className="vp-internal-card__overlay">
                  {brandLine ? (
                    <p className="vp-internal-card__brand">{brandLine}</p>
                  ) : null}
                  <h2 className="vp-internal-card__title">{campaignText}</h2>
                  <p className="vp-internal-card__date">
                    {formatPublishDate(entry.publishedAt)}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
