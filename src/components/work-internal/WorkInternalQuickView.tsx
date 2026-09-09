/**
 * WorkInternalQuickView — centered modal for a library entry.
 *
 * Video playback mirrors ShowreelVideoLightbox (client Lazy* players).
 * Dismiss: close button, Escape, backdrop mousedown.
 */

'use client';

import {useEffect, useId, useRef} from 'react';
import {decodeHtmlEntities} from '@/lib/decode-html-entities';
import {resolveCreditsForDisplay} from '@/lib/credits-config';
import {urlForImage} from '@/lib/sanity';
import {parseVideoUrl} from '@/lib/video-url';
import {vimeoThumbnailUrl} from '@/lib/vimeo';
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang';
import {LazyVimeoPlayer} from '@/components/portfolio/LazyVimeoPlayer';
import {LazyYouTubePlayer} from '@/components/ui/LazyYouTubePlayer';
import {LazyXinpianchangPlayer} from '@/components/portfolio/LazyXinpianchangPlayer';
import type {Locale} from '@/i18n/routing';
import type {
  InternalLibraryEntry,
  NamedSlugTerm,
  TaxonomyTerm,
} from '@/types/sanity';
import {openPortfolioEntry} from './entry-url';
import {getPrimaryClientName} from './filter-entries';
import {formatPublishDate, getDisplayTitle} from './text';

interface WorkInternalQuickViewProps {
  entry: InternalLibraryEntry;
  locale: Locale;
  onClose: () => void;
}

function taxonomyLabel(term: TaxonomyTerm, locale: Locale): string {
  const raw =
    locale === 'zh' && term.titleZh?.trim() ? term.titleZh : term.title;
  return decodeHtmlEntities(raw);
}

function namedLabels(terms: NamedSlugTerm[] | undefined): string[] {
  return (terms ?? [])
    .map((t) => t.name?.trim())
    .filter((name): name is string => Boolean(name));
}

function QuickViewPlayer({entry}: {entry: InternalLibraryEntry}) {
  const featuredPoster = entry.featuredImage
    ? urlForImage(entry.featuredImage).width(1920).height(1080).fit('crop').url()
    : undefined;
  const parsed = entry.vimeoUrl?.trim()
    ? parseVideoUrl(entry.vimeoUrl)
    : null;
  const vimeoPoster =
    parsed?.provider === 'vimeo'
      ? (vimeoThumbnailUrl(parsed.url) ?? undefined)
      : undefined;
  const posterUrl = featuredPoster ?? vimeoPoster;

  if (parsed?.provider === 'youtube') {
    return (
      <LazyYouTubePlayer
        videoId={parsed.id}
        portfolioEntryRef={entry._id}
      />
    );
  }

  if (parsed?.provider === 'vimeo') {
    return (
      <LazyVimeoPlayer
        vimeoUrl={parsed.url}
        posterUrl={posterUrl}
        portfolioEntryRef={entry._id}
        autoPlay={false}
        posterSizes="(max-width: 992px) 100vw, min(960px, 92vw)"
        priority
      />
    );
  }

  if (
    entry.xinpianchangUrl &&
    xinpianchangToEmbedUrl(entry.xinpianchangUrl)
  ) {
    return (
      <LazyXinpianchangPlayer
        embedUrl={entry.xinpianchangUrl}
        posterUrl={posterUrl}
        portfolioEntryRef={entry._id}
      />
    );
  }

  return (
    <div className="vp-internal-quickview__no-video">
      No playable video for this project.
    </div>
  );
}

export function WorkInternalQuickView({
  entry,
  locale,
  onClose,
}: WorkInternalQuickViewProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const title = getDisplayTitle(entry, locale);
  const client = getPrimaryClientName(entry);
  const platforms = namedLabels(entry.platforms);
  const formats = (entry.videoFormats ?? []).map((t) =>
    taxonomyLabel(t, locale),
  );
  const industries = (entry.industries ?? []).map((t) =>
    taxonomyLabel(t, locale),
  );
  const markets = (entry.markets ?? []).map((t) => taxonomyLabel(t, locale));
  const creditRows = resolveCreditsForDisplay({
    crewCredits: entry.crewCredits,
    locale,
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="vp-internal-quickview"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="vp-internal-quickview__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="vp-internal-quickview__chrome">
          <div className="vp-internal-quickview__heading">
            <h2 id={titleId} className="vp-internal-quickview__title">
              {title}
            </h2>
            <p className="vp-internal-quickview__sub">
              {entry.isHidden ? (
                <span className="vp-internal-badge vp-internal-badge--hidden">
                  Hidden
                </span>
              ) : (
                <span className="vp-internal-badge vp-internal-badge--public">
                  Public
                </span>
              )}
              {entry.publishedAt ? (
                <span className="vp-internal-quickview__date">
                  {formatPublishDate(entry.publishedAt)}
                </span>
              ) : null}
            </p>
          </div>
          <div className="vp-internal-quickview__chrome-actions">
            <button
              type="button"
              className="vp-internal-quickview__open"
              onClick={() => openPortfolioEntry(entry, locale)}
            >
              Open public page ↗
            </button>
            <button
              ref={closeRef}
              type="button"
              className="vp-internal-quickview__close"
              onClick={onClose}
              aria-label="Close quick view"
            >
              Close
            </button>
          </div>
        </header>

        <div className="vp-internal-quickview__player">
          <QuickViewPlayer entry={entry} />
        </div>

        <div className="vp-internal-quickview__body">
          <dl className="vp-internal-quickview__facts">
            <div>
              <dt>Client</dt>
              <dd>{client === '—' ? '—' : client}</dd>
            </div>
            {platforms.length > 0 ? (
              <div>
                <dt>Platform</dt>
                <dd>{platforms.join(', ')}</dd>
              </div>
            ) : null}
          </dl>

          {(formats.length > 0 ||
            industries.length > 0 ||
            markets.length > 0) && (
            <div className="vp-internal-quickview__tags" aria-label="Taxonomy">
              {formats.map((label) => (
                <span key={`f-${label}`} className="vp-internal-quickview__tag">
                  {label}
                </span>
              ))}
              {industries.map((label) => (
                <span key={`i-${label}`} className="vp-internal-quickview__tag">
                  {label}
                </span>
              ))}
              {markets.map((label) => (
                <span key={`m-${label}`} className="vp-internal-quickview__tag">
                  {label}
                </span>
              ))}
            </div>
          )}

          {creditRows.length > 0 ? (
            <div className="vp-internal-quickview__credits">
              <h3 className="vp-internal-quickview__section-title">Credits</h3>
              {creditRows.map((row) => (
                <section
                  key={row.key}
                  className="vp-internal-quickview__dept"
                  aria-label={row.label}
                >
                  <h4 className="vp-internal-quickview__dept-label">
                    {row.label}
                  </h4>
                  <dl className="vp-internal-quickview__pairs">
                    {row.pairs.map((pair) => (
                      <div key={`${row.key}-${pair.role}-${pair.names}`}>
                        <dt>{pair.role}</dt>
                        <dd>{pair.names}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          ) : (
            <p className="vp-internal-quickview__empty-credits">
              No structured credits for this project.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
