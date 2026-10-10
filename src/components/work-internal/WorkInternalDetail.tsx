/**
 * WorkInternalDetail — full-viewport utilitarian project page for the
 * internal library (app.vantage.pictures/[slug] via rewrite).
 */

'use client';

import {useEffect, useId, useMemo, useRef, useState} from 'react';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {
  resolvePortfolioVideos,
  type PortfolioVideoFields,
} from '@portfolio-videos';
import {decodeHtmlEntities} from '@/lib/decode-html-entities';
import {resolveCreditsForDisplay} from '@/lib/credits-config';
import {
  libraryReturnBrowserPath,
  marketingHomeUrl,
} from '@/lib/internal-app-paths';
import {urlForImage} from '@/lib/sanity';
import {parseVideoUrl} from '@/lib/video-url';
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang';
import {LazyVimeoPlayer} from '@/components/portfolio/LazyVimeoPlayer';
import {LazyYouTubePlayer} from '@/components/ui/LazyYouTubePlayer';
import {LazyXinpianchangPlayer} from '@/components/portfolio/LazyXinpianchangPlayer';
import type {Locale} from '@/i18n/routing';
import type {
  InternalLibraryEntry,
  TaxonomyTerm,
} from '@/types/sanity';
import {getPublicPortfolioUrl} from './entry-url';
import {formatPublishDate, getDisplayTitle, getDisplayTitleParts} from './text';
import {workInternalVideoPosterKey} from './video-poster-key';
import {WorkInternalKeyVisuals} from './WorkInternalKeyVisuals';

interface WorkInternalDetailProps {
  entry: InternalLibraryEntry;
  locale: Locale;
  /** Server-resolved posters (Vimeo API/oEmbed, YouTube CDN). */
  videoPosters?: Record<string, string>;
}

function taxonomyLabel(term: TaxonomyTerm, locale: Locale): string {
  const raw =
    locale === 'zh' && term.titleZh?.trim() ? term.titleZh : term.title;
  return decodeHtmlEntities(raw);
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
  index: number,
  videoPosters: Record<string, string>,
): string | undefined {
  const fromServer = videoPosters[workInternalVideoPosterKey(video, index)];
  if (fromServer) return fromServer;

  // Fallback when server map is missing (e.g. partial hydrate).
  if (entry.featuredImage) {
    return urlForImage(entry.featuredImage)
      .width(960)
      .height(540)
      .fit('crop')
      .url();
  }
  return undefined;
}

/** 1 = forward (next / from-right), -1 = back (prev / from-left). */
function navDirection(from: number, to: number, length: number): 1 | -1 {
  if (length < 2 || from === to) return 1;
  if ((from + 1) % length === to) return 1;
  if ((from - 1 + length) % length === to) return -1;
  const forwardDist = (to - from + length) % length;
  return forwardDist <= length / 2 ? 1 : -1;
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.42 6.29 6.29-6.3 6.3 1.42 1.4 6.29-6.29 6.3 6.3 1.4-1.42-6.29-6.29 6.3-6.3z"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
      />
    </svg>
  );
}

function videoResumeKey(
  entryId: string,
  video: PortfolioVideoFields,
  index: number,
): string {
  return video._key?.trim() || `${entryId}:${index}`;
}

function VideoPlayer({
  entryId,
  video,
  posterUrl,
  autoPlay = false,
  inlinePlayback = false,
  priority = false,
  posterSizes,
  startAtSeconds = 0,
  onTimeUpdate,
}: {
  entryId: string;
  video: PortfolioVideoFields;
  posterUrl?: string;
  autoPlay?: boolean;
  inlinePlayback?: boolean;
  priority?: boolean;
  posterSizes: string;
  startAtSeconds?: number;
  onTimeUpdate?: (seconds: number) => void;
}) {
  const parsed = video.vimeoUrl?.trim()
    ? parseVideoUrl(video.vimeoUrl)
    : null;

  if (parsed?.provider === 'youtube') {
    return (
      <LazyYouTubePlayer
        videoId={parsed.id}
        portfolioEntryRef={entryId}
        autoPlay={autoPlay}
        inlinePlayback={inlinePlayback}
        startAtSeconds={startAtSeconds}
        onTimeUpdate={onTimeUpdate}
      />
    );
  }

  if (parsed?.provider === 'vimeo') {
    return (
      <LazyVimeoPlayer
        vimeoUrl={parsed.url}
        posterUrl={posterUrl}
        portfolioEntryRef={entryId}
        autoPlay={autoPlay}
        inlinePlayback={inlinePlayback}
        startAtSeconds={startAtSeconds}
        onTimeUpdate={onTimeUpdate}
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
        posterUrl={posterUrl}
        portfolioEntryRef={entryId}
        autoPlay={autoPlay}
        inlinePlayback={inlinePlayback}
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
  entry,
  videos,
  initialIndex,
  locale,
  campaignTitle,
  videoPosters,
  onClose,
}: {
  entry: InternalLibraryEntry;
  videos: PortfolioVideoFields[];
  initialIndex: number;
  locale: Locale;
  campaignTitle: string;
  videoPosters: Record<string, string>;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(videos.length - 1, 0)),
  );
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [isSliding, setIsSliding] = useState(false);
  const [leavePosterUrl, setLeavePosterUrl] = useState<string | null>(null);
  const positionsRef = useRef<Record<string, number>>({});
  const currentTimeRef = useRef(0);

  const featuredPoster = entry.featuredImage
    ? urlForImage(entry.featuredImage)
        .width(1920)
        .height(1080)
        .fit('crop')
        .url()
    : null;

  const activeVideo = videos[activeIndex] ?? videos[0] ?? null;
  const multi = videos.length > 1;
  const resumeKey = activeVideo
    ? videoResumeKey(entry._id, activeVideo, activeIndex)
    : '';
  const startAtSeconds = resumeKey
    ? (positionsRef.current[resumeKey] ?? 0)
    : 0;
  const title = activeVideo
    ? episodeTitle(
        activeVideo,
        locale,
        activeIndex === 0 ? campaignTitle : `Film ${activeIndex + 1}`,
      )
    : campaignTitle;
  const activePoster = activeVideo
    ? posterForVideo(entry, activeVideo, activeIndex, videoPosters)
    : undefined;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the dialog (not Close) so arrow keys don't paint :focus-visible on X.
    panelRef.current?.focus({preventScroll: true});
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!isSliding) return;
    const timer = window.setTimeout(() => setIsSliding(false), 380);
    return () => window.clearTimeout(timer);
  }, [isSliding, resumeKey]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (!multi) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(activeIndex - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(activeIndex + 1);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // goTo closes over latest refs/index — rebind when activeIndex changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [onClose, multi, activeIndex, isSliding]);

  function bookmarkActive() {
    if (!activeVideo) return;
    const key = videoResumeKey(entry._id, activeVideo, activeIndex);
    if (currentTimeRef.current > 0.25) {
      positionsRef.current[key] = currentTimeRef.current;
    }
  }

  function goTo(nextIndex: number) {
    if (!multi || videos.length < 1 || isSliding) return;
    const wrapped =
      ((nextIndex % videos.length) + videos.length) % videos.length;
    if (wrapped === activeIndex) return;
    bookmarkActive();
    currentTimeRef.current = 0;
    setLeavePosterUrl(activePoster ?? featuredPoster);
    setSlideDir(navDirection(activeIndex, wrapped, videos.length));
    setIsSliding(true);
    setActiveIndex(wrapped);
  }

  if (!activeVideo) {
    return (
      <div
        className="vp-showreel-lightbox"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          className="vp-showreel-lightbox__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <button
            type="button"
            className="vp-showreel-lightbox__close"
            onClick={onClose}
            aria-label="Close video"
          >
            <CloseIcon />
          </button>
          <p id={titleId} className="vp-showreel-lightbox__title">
            No playable video for this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="vp-showreel-lightbox"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="vp-showreel-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="vp-showreel-lightbox__stage">
          <button
            type="button"
            className="vp-showreel-lightbox__close"
            onClick={onClose}
            aria-label="Close video"
          >
            <CloseIcon />
          </button>
          <div className="vp-showreel-lightbox__player">
            <div
              className={
                isSliding
                  ? slideDir === 1
                    ? 'vp-showreel-lightbox__viewport is-sliding is-dir-next'
                    : 'vp-showreel-lightbox__viewport is-sliding is-dir-prev'
                  : 'vp-showreel-lightbox__viewport'
              }
            >
              {isSliding && leavePosterUrl ? (
                <div
                  className="vp-showreel-lightbox__slide vp-showreel-lightbox__slide--leave"
                  aria-hidden="true"
                >
                  <Image
                    src={leavePosterUrl}
                    alt=""
                    fill
                    sizes="(max-width: 992px) 100vw, min(1100px, 92vw)"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div
                key={resumeKey}
                className={
                  isSliding
                    ? 'vp-showreel-lightbox__slide vp-showreel-lightbox__slide--enter'
                    : 'vp-showreel-lightbox__slide'
                }
              >
                <VideoPlayer
                  entryId={entry._id}
                  video={activeVideo}
                  posterUrl={activePoster}
                  autoPlay
                  inlinePlayback
                  priority
                  posterSizes="(max-width: 992px) 100vw, min(1100px, 92vw)"
                  startAtSeconds={startAtSeconds}
                  onTimeUpdate={(seconds) => {
                    currentTimeRef.current = seconds;
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="vp-showreel-lightbox__footer">
          <h2 id={titleId} className="vp-showreel-lightbox__title">
            {title}
          </h2>
          {multi ? (
            <div className="vp-showreel-lightbox__nav">
              <span className="vp-showreel-lightbox__count" aria-live="polite">
                {activeIndex + 1} / {videos.length}
              </span>
              <button
                type="button"
                className="vp-showreel-lightbox__nav-btn"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous video"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className="vp-showreel-lightbox__nav-btn"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next video"
              >
                <ChevronRightIcon />
              </button>
            </div>
          ) : null}
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
  videoPosters,
  onOpen,
}: {
  entry: InternalLibraryEntry;
  videos: PortfolioVideoFields[];
  locale: Locale;
  campaignTitle: string;
  videoPosters: Record<string, string>;
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
        const poster = posterForVideo(entry, video, index, videoPosters);

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
        router.push(libraryReturnBrowserPath());
      }}
    >
      ← Back to Full Work
    </button>
  );
}

export function WorkInternalDetail({
  entry,
  locale,
  videoPosters = {},
}: WorkInternalDetailProps) {
  const title = getDisplayTitle(entry, locale);
  const {brandLine, campaignLine} = getDisplayTitleParts(entry, locale);
  const campaignText = campaignLine || title;
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
  const hasKeyVisuals = (entry.keyVisuals ?? []).some((item) =>
    Boolean(item?.asset?._id),
  );

  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(
    null,
  );
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );

  async function copyPublicLink() {
    try {
      await navigator.clipboard.writeText(
        getPublicPortfolioUrl(entry, locale),
      );
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }

  return (
    <div className="vp-internal-detail">
      <header className="vp-internal-nav" aria-label="Project details">
        <div className="vp-internal-nav__inner">
          <a
            className="vp-internal-nav__brand"
            href={marketingHomeUrl()}
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
          </a>
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
            className={
              copyState === 'copied'
                ? 'vp-internal-detail__copy-link is-copied'
                : copyState === 'failed'
                  ? 'vp-internal-detail__copy-link is-failed'
                  : 'vp-internal-detail__copy-link'
            }
            onClick={copyPublicLink}
            aria-label={
              copyState === 'copied'
                ? 'Copied'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy public link to clipboard'
            }
          >
            {copyState === 'copied'
              ? 'Copied'
              : copyState === 'failed'
                ? 'Copy failed'
                : 'Copy to clipboard'}
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
          <section
            className="vp-internal-detail__media-section"
            aria-labelledby="work-internal-videos-heading"
          >
            <h2
              id="work-internal-videos-heading"
              className="vp-internal-detail__section-title"
            >
              Videos
            </h2>
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
                  posterUrl={posterForVideo(
                    entry,
                    playableVideos[0],
                    0,
                    videoPosters,
                  )}
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
                videoPosters={videoPosters}
                onOpen={(_video, index) => setActiveVideoIndex(index)}
              />
            )}
          </section>

          {hasKeyVisuals ? (
            <section
              className="vp-internal-detail__media-section"
              aria-labelledby="work-internal-key-visuals-heading"
            >
              <h2
                id="work-internal-key-visuals-heading"
                className="vp-internal-detail__section-title"
              >
                Key Visuals
              </h2>
              <WorkInternalKeyVisuals keyVisuals={entry.keyVisuals} />
            </section>
          ) : null}
        </div>

        <div className="vp-internal-detail__body">
          <h1 className="vp-internal-detail__title">
            {brandLine ? (
              <span className="vp-internal-list__brand">{brandLine}</span>
            ) : null}
            <span className="vp-internal-list__campaign">{campaignText}</span>
          </h1>

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

      {activeVideoIndex !== null && playableVideos.length > 0 ? (
        <DetailVideoLightbox
          entry={entry}
          videos={playableVideos}
          initialIndex={activeVideoIndex}
          locale={locale}
          campaignTitle={title}
          videoPosters={videoPosters}
          onClose={() => setActiveVideoIndex(null)}
        />
      ) : null}
    </div>
  );
}
