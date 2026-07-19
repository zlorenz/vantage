/**
 * Side detail pane — video preview, credits, taxonomies, public link.
 */

'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { LazyVimeoPlayer } from '@/components/portfolio/LazyVimeoPlayer';
import { PortfolioCredits } from '@/components/portfolio/PortfolioCredits';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { urlForImage } from '@/lib/sanity';
import type { Locale } from '@/i18n/routing';
import type { InternalLibraryEntry, TaxonomyTerm } from '@/types/sanity';
import {
  getArtName,
  getCrewName,
  getEditorName,
  getPrimaryClientName,
} from './filter-entries';
import { formatPublishDate, getDisplayTitle } from './text';

interface WorkInternalDetailPaneProps {
  entry: InternalLibraryEntry;
  locale: Locale;
  onClose: () => void;
}

function taxonomyLabels(terms: TaxonomyTerm[] | undefined): string {
  if (!terms?.length) return '—';
  return terms.map((t) => decodeHtmlEntities(t.title)).join(', ');
}

export function WorkInternalDetailPane({
  entry,
  locale,
  onClose,
}: WorkInternalDetailPaneProps) {
  const slugParam =
    locale === 'zh' ? entry.slugZh || entry.slug : entry.slug;
  const posterUrl = urlForImage(entry.featuredImage)
    .width(1280)
    .height(720)
    .fit('crop')
    .url();
  const title = getDisplayTitle(entry);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside
      className="vp-internal-pane"
      aria-label={`Details for ${title}`}
    >
      <div className="vp-internal-pane__header">
        <div>
          <h2 className="vp-internal-pane__title">{title}</h2>
          <p className="vp-internal-pane__subtitle">
            {formatPublishDate(entry.publishedAt)}
            {getPrimaryClientName(entry) !== '—' ? (
              <> · {getPrimaryClientName(entry)}</>
            ) : null}
            {entry.isHidden ? (
              <>
                {' · '}
                <span className="vp-internal-badge vp-internal-badge--hidden">
                  Hidden
                </span>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className="vp-internal-pane__close"
          onClick={onClose}
          aria-label="Close details"
        >
          ×
        </button>
      </div>

      <div className="vp-internal-pane__video">
        <LazyVimeoPlayer
          key={entry._id}
          vimeoUrl={entry.vimeoUrl}
          posterUrl={posterUrl}
          posterAlt={title}
        />
      </div>

      <dl className="vp-internal-pane__facts">
        <div>
          <dt>Director</dt>
          <dd>{getCrewName(entry, 'director')}</dd>
        </div>
        <div>
          <dt>DOP</dt>
          <dd>{getCrewName(entry, 'dop')}</dd>
        </div>
        <div>
          <dt>Art</dt>
          <dd>{getArtName(entry)}</dd>
        </div>
        <div>
          <dt>Editor</dt>
          <dd>{getEditorName(entry)}</dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{taxonomyLabels(entry.videoFormats)}</dd>
        </div>
        <div>
          <dt>Industry</dt>
          <dd>{taxonomyLabels(entry.industries)}</dd>
        </div>
        <div>
          <dt>Market</dt>
          <dd>{taxonomyLabels(entry.markets)}</dd>
        </div>
      </dl>

      {entry.credits ? (
        <div className="vp-internal-pane__credits">
          <h3 className="vp-internal-pane__section-title">Credits</h3>
          <PortfolioCredits credits={entry.credits} locale={locale} />
        </div>
      ) : null}

      <div className="vp-internal-pane__actions">
        <Link
          href={{
            pathname: '/portfolio/[slug]',
            params: { slug: slugParam },
          }}
          className="vp-internal-pane__link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open public page ↗
        </Link>
      </div>
    </aside>
  );
}
