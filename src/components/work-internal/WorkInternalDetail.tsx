/**
 * WorkInternalDetail — full-viewport utilitarian project page for
 * `/work-internal/[slug]` (temporary prefix until app.vantage.pictures).
 */

'use client';

import {Link, useRouter} from '@/i18n/navigation';
import {decodeHtmlEntities} from '@/lib/decode-html-entities';
import {resolveCreditsForDisplay} from '@/lib/credits-config';
import {libraryReturnBrowserPath} from '@/lib/internal-app-paths';
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

interface WorkInternalDetailProps {
  entry: InternalLibraryEntry;
  locale: Locale;
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

function DetailPlayer({entry}: {entry: InternalLibraryEntry}) {
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
        posterSizes="(max-width: 992px) 100vw, min(1100px, 70vw)"
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
    <div className="vp-internal-detail__no-video">
      No playable video for this project.
    </div>
  );
}

function BackToLibraryButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="vp-internal-detail__back"
      onClick={() => {
        // String href keeps filter query from sessionStorage (typed path alone cannot).
        router.push(libraryReturnBrowserPath() as '/work-internal');
      }}
    >
      ← Back to Full Work
    </button>
  );
}

export function WorkInternalDetail({entry, locale}: WorkInternalDetailProps) {
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

  return (
    <div className="vp-internal-detail">
      <header className="vp-internal-nav" aria-label="Project details">
        <div className="vp-internal-nav__inner">
          <Link
            className="vp-internal-nav__brand"
            href="/"
            rel="home noopener noreferrer"
            target="_blank"
          >
            {/* SVG via <img> — next/image does not optimize SVGs */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/vantage-logo.svg"
              alt="Vantage Pictures"
              width={36}
              height={36}
              className="vp-internal-nav__mark"
            />
          </Link>
          <p className="vp-internal-detail__nav-title">{title}</p>
          <span className="vp-internal-nav__title">Project</span>
        </div>
      </header>

      <div className="vp-internal-detail__toolbar">
        <BackToLibraryButton />
        <div className="vp-internal-detail__toolbar-actions">
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
            <span className="vp-internal-detail__date">
              {formatPublishDate(entry.publishedAt)}
            </span>
          ) : null}
          <button
            type="button"
            className="vp-internal-detail__open-public"
            onClick={() => openPortfolioEntry(entry, locale)}
          >
            Open public page ↗
          </button>
        </div>
      </div>

      <div className="vp-internal-detail__layout">
        <div className="vp-internal-detail__player">
          <DetailPlayer entry={entry} />
        </div>

        <div className="vp-internal-detail__body">
          <h1 className="vp-internal-detail__title">{title}</h1>

          <dl className="vp-internal-detail__facts">
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
            <div className="vp-internal-detail__tags" aria-label="Taxonomy">
              {formats.map((label) => (
                <span key={`f-${label}`} className="vp-internal-detail__tag">
                  {label}
                </span>
              ))}
              {industries.map((label) => (
                <span key={`i-${label}`} className="vp-internal-detail__tag">
                  {label}
                </span>
              ))}
              {markets.map((label) => (
                <span key={`m-${label}`} className="vp-internal-detail__tag">
                  {label}
                </span>
              ))}
            </div>
          )}

          {creditRows.length > 0 ? (
            <div className="vp-internal-detail__credits">
              <h2 className="vp-internal-detail__section-title">Credits</h2>
              {creditRows.map((row) => (
                <section
                  key={row.key}
                  className="vp-internal-detail__dept"
                  aria-label={row.label}
                >
                  <h3 className="vp-internal-detail__dept-label">
                    {row.label}
                  </h3>
                  <dl className="vp-internal-detail__pairs">
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
            <p className="vp-internal-detail__empty-credits">
              No structured credits for this project.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
