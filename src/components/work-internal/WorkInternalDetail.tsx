/**
 * WorkInternalDetail — full-viewport utilitarian project page for
 * `/work-internal/[slug]` (temporary prefix until app.vantage.pictures).
 */

'use client';

import {useEffect, useId, useMemo, useRef, useState} from 'react';
import Image from 'next/image';
import {Link, useRouter} from '@/i18n/navigation';
import {
  resolvePortfolioVideos,
  type PortfolioVideoFields,
} from '@portfolio-videos';
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

function isPlayableVideo(video: PortfolioVideoFields): boolean {
  if (video.vimeoUrl?.trim()) {
    const parsed = parseVideoUrl(video.vimeoUrl);
    if (parsed?.provider === 'vimeo' || parsed?.provider === 'youtube') {
      return true;
    }
  }
  return Boolean(
    video.xinpianchangUrl && xinpianchangToEmbedUrl(video.xinpianchangUrl),
  );
}

function episodeTitle(
  video: PortfolioVideoFields,
  locale: Locale,
  fallback: string,
): string {
  const raw =
    locale === 'zh' && video.videoTitleZh?.trim()
      ? video.videoTitleZh
      : video.videoTitle?.trim()
        ? video.videoTitle
        : fallback;
  return decodeHtmlEntities(raw);
}

function posterForVideo(
  entry: InternalLibraryEntry,
  video: PortfolioVideoFields,
  isMain: boolean,
): string | undefined {
  if (isMain && entry.featuredImage) {
    return urlForImage(entry.featuredImage)
      .width(960)
      .height(540)
      .fit('crop')
      .url();
  }
  const parsed = video.vimeoUrl?.trim()
    ? parseVideoUrl(video.vimeoUrl)
    : null;
  if (parsed?.provider === 'vimeo') {
    return vimeoThumbnailUrl(parsed.url) ?? undefined;
  }
  if (entry.featuredImage) {
    return urlForImage(entry.featuredImage)
      .width(960)
      .height(540)
      .fit('crop')
      .url();
  }
  return undefined;
}

function VideoPlayer({
  entryId,
  video,
  posterUrl,
  autoPlay = false,
  priority = false,
  posterSizes,
}: {
  entryId: string;
  video: PortfolioVideoFields;
  posterUrl?: string;
  autoPlay?: boolean;
  priority?: boolean;
  posterSizes: string;
}) {
  const parsed = video.vimeoUrl?.trim()
    ? parseVideoUrl(video.vimeoUrl)
    : null;
  const vimeoPoster =
    parsed?.provider === 'vimeo'
      ? (vimeoThumbnailUrl(parsed.url) ?? undefined)
      : undefined;
  const resolvedPoster = posterUrl ?? vimeoPoster;

  if (parsed?.provider === 'youtube') {
    return (
      <LazyYouTubePlayer videoId={parsed.id} portfolioEntryRef={entryId} />
    );
  }

  if (parsed?.provider === 'vimeo') {
    return (
      <LazyVimeoPlayer
        vimeoUrl={parsed.url}
        posterUrl={resolvedPoster}
        portfolioEntryRef={entryId}
        autoPlay={autoPlay}
        posterSizes={posterSizes}
        priority={priority}
      />
    );
  }

  if (
    video.xinpianchangUrl &&
    xinpianchangToEmbedUrl(video.xinpianchangUrl)
  ) {
    return (
      <LazyXinpianchangPlayer
        embedUrl={video.xinpianchangUrl}
        posterUrl={resolvedPoster}
        portfolioEntryRef={entryId}
      />
    );
  }

  return (
    <div className="vp-internal-detail__no-video">
      No playable video for this project.
    </div>
  );
}

function DetailVideoLightbox({
  entryId,
  video,
  title,
  posterUrl,
  onClose,
}: {
  entryId: string;
  video: PortfolioVideoFields;
  title: string;
  posterUrl?: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

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
      className="vp-showreel-lightbox"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="vp-showreel-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="vp-showreel-lightbox__chrome">
          <h2 id={titleId} className="vp-showreel-lightbox__title">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="vp-showreel-lightbox__close"
            onClick={onClose}
            aria-label="Close video"
          >
            Close
          </button>
        </div>
        <div className="vp-showreel-lightbox__player">
          <VideoPlayer
            entryId={entryId}
            video={video}
            posterUrl={posterUrl}
            autoPlay
            priority
            posterSizes="(max-width: 992px) 100vw, min(1100px, 92vw)"
          />
        </div>
      </div>
    </div>
  );
}

function DetailVideoGrid({
  entry,
  videos,
  locale,
  campaignTitle,
  onOpen,
}: {
  entry: InternalLibraryEntry;
  videos: PortfolioVideoFields[];
  locale: Locale;
  campaignTitle: string;
  onOpen: (video: PortfolioVideoFields, index: number) => void;
}) {
  return (
    <div
      className="vp-internal-detail__video-grid"
      role="list"
      aria-label="Project films"
    >
      {videos.map((video, index) => {
        const isMain = index === 0;
        const title = episodeTitle(
          video,
          locale,
          isMain ? campaignTitle : `Film ${index + 1}`,
        );
        const poster = posterForVideo(entry, video, isMain);

        return (
          <div key={video._key ?? `film-${index}`} role="listitem" className="vp-internal-card">
            <button
              type="button"
              className="vp-internal-card__hit"
              onClick={() => onOpen(video, index)}
            >
              <div className="vp-internal-card__media">
                {poster ? (
                  <Image
                    src={poster}
                    alt=""
                    fill
                    sizes="(max-width: 992px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : null}
                {isMain ? (
                  <span className="vp-internal-badge vp-internal-badge--public">
                    Main
                  </span>
                ) : null}
                <div className="vp-internal-card__overlay">
                  <h2 className="vp-internal-card__title">{title}</h2>
                </div>
              </div>
            </button>
          </div>
        );
      })}
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

  const playableVideos = useMemo(
    () => resolvePortfolioVideos(entry).filter(isPlayableVideo),
    [entry],
  );

  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(
    null,
  );
  const activeVideo =
    activeVideoIndex !== null ? playableVideos[activeVideoIndex] : null;

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
        <div
          className={
            playableVideos.length > 1
              ? 'vp-internal-detail__media vp-internal-detail__media--grid'
              : 'vp-internal-detail__media'
          }
        >
          {playableVideos.length === 0 ? (
            <div className="vp-internal-detail__player">
              <div className="vp-internal-detail__no-video">
                No playable video for this project.
              </div>
            </div>
          ) : playableVideos.length === 1 ? (
            <div className="vp-internal-detail__player">
              <VideoPlayer
                entryId={entry._id}
                video={playableVideos[0]}
                posterUrl={posterForVideo(entry, playableVideos[0], true)}
                priority
                posterSizes="(max-width: 992px) 100vw, min(1100px, 70vw)"
              />
            </div>
          ) : (
            <DetailVideoGrid
              entry={entry}
              videos={playableVideos}
              locale={locale}
              campaignTitle={title}
              onOpen={(_video, index) => setActiveVideoIndex(index)}
            />
          )}
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
            <div className="vp-internal-detail__taxonomy" aria-label="Taxonomy">
              {formats.length > 0 ? (
                <div className="vp-internal-detail__tax-group">
                  <h2 className="vp-internal-detail__tax-heading">Format</h2>
                  <div className="vp-internal-detail__tags">
                    {formats.map((label) => (
                      <span
                        key={`f-${label}`}
                        className="vp-internal-detail__tag"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {industries.length > 0 ? (
                <div className="vp-internal-detail__tax-group">
                  <h2 className="vp-internal-detail__tax-heading">Industry</h2>
                  <div className="vp-internal-detail__tags">
                    {industries.map((label) => (
                      <span
                        key={`i-${label}`}
                        className="vp-internal-detail__tag"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {markets.length > 0 ? (
                <div className="vp-internal-detail__tax-group">
                  <h2 className="vp-internal-detail__tax-heading">Market</h2>
                  <div className="vp-internal-detail__tags">
                    {markets.map((label) => (
                      <span
                        key={`m-${label}`}
                        className="vp-internal-detail__tag"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
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

      {activeVideo ? (
        <DetailVideoLightbox
          entryId={entry._id}
          video={activeVideo}
          title={episodeTitle(
            activeVideo,
            locale,
            activeVideoIndex === 0 ? title : `Film ${(activeVideoIndex ?? 0) + 1}`,
          )}
          posterUrl={posterForVideo(
            entry,
            activeVideo,
            activeVideoIndex === 0,
          )}
          onClose={() => setActiveVideoIndex(null)}
        />
      ) : null}
    </div>
  );
}
