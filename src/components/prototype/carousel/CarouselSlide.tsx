'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import {useLocale} from 'next-intl';
import {PortfolioEntryLink} from '@/components/navigation/PortfolioEntryLink';
import {trackImpressionOnce, trackVideoEvent} from '@/lib/video-events';
import {normalizeStoredVideoUrl} from '@/lib/video-url';
import {extractVimeoId} from '@/lib/vimeo';
import {CarouselVimeo} from './CarouselVimeo';
import {
  detectPillarboxContentAspect,
  isCarouselCoverMathEnabled,
  scheduleIdleWork,
} from './detect-pillarbox-aspect';
import type {PrototypeCarouselSlide} from './types';

interface CarouselSlideProps {
  slide: PrototypeCarouselSlide;
  index: number;
  active: boolean;
  mountPlayer: boolean;
}

export const CarouselSlide = forwardRef<HTMLElement, CarouselSlideProps>(
  function CarouselSlide({slide, index, active, mountPlayer}, ref) {
    const locale = useLocale();
    const [playerReady, setPlayerReady] = useState(false);
    const [contentAspectHint, setContentAspectHint] = useState<number | null>(
      null,
    );
    /** Pointer origin for drag-vs-tap suppression on the whole-card link. */
    const pointerStartRef = useRef<{x: number; y: number} | null>(null);
    const portfolioSlug = slide.hrefSlug?.trim() || null;
    const slideKey = slide.portfolioEntryRef || slide.slug;
    const videoId = slide.vimeoUrl
      ? extractVimeoId(normalizeStoredVideoUrl(slide.vimeoUrl)) ?? undefined
      : undefined;
    const carouselEventBase = {
      source: 'native_carousel' as const,
      videoId,
      portfolioEntryRef: slide.portfolioEntryRef,
    };
    const interactive = active;
    // ZH: static featuredImage poster only — no Vimeo/XPC preview (autoplay unreliable).
    const allowVideoPreview = locale !== 'zh';
    const shouldMountVideo = allowVideoPreview && mountPlayer && Boolean(slide.vimeoUrl);

    useEffect(() => {
      if (!shouldMountVideo) {
        setPlayerReady(false);
      }
    }, [shouldMountVideo]);

    useEffect(() => {
      if (!active) return;
      trackImpressionOnce(slideKey, carouselEventBase);
    }, [active, slideKey, videoId, slide.portfolioEntryRef]);

    const trackCarouselClickThrough = () => {
      trackVideoEvent({
        eventType: 'click_through',
        ...carouselEventBase,
      });
    };

    /** Suppress navigation when the gesture was a drag (Embla swipe), not a tap. */
    const CARD_DRAG_CLICK_SUPPRESS_PX = 8;

    const onCardPointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
      pointerStartRef.current = {x: event.clientX, y: event.clientY};
    };

    const onCardLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (start) {
        const dx = Math.abs(event.clientX - start.x);
        const dy = Math.abs(event.clientY - start.y);
        if (
          dx > CARD_DRAG_CLICK_SUPPRESS_PX ||
          dy > CARD_DRAG_CLICK_SUPPRESS_PX
        ) {
          event.preventDefault();
          return;
        }
      }
      trackCarouselClickThrough();
    };

    // Desktop-only: scan the poster that desktop actually paints for baked-in
    // side bars. Prefer posterUrlDesktop (16:9) — the mobile bake is a tall
    // crop that already removes pillar bars, so scanning posterUrl alone made
    // cover-math miss Realme-style masters after the dual-URL split.
    // Mobile keeps fill + object-fit cover — canvas scans during swipe janked Embla.
    useEffect(() => {
      const scanUrl =
        (slide.posterUrlDesktop || slide.posterUrl)?.trim() || null;
      if (!scanUrl || !isCarouselCoverMathEnabled()) {
        setContentAspectHint(null);
        return;
      }

      let cancelled = false;
      let cancelIdle = () => {};

      const scan = (source: HTMLImageElement) => {
        if (cancelled) return;
        cancelIdle = scheduleIdleWork(() => {
          if (cancelled) return;
          const aspect = detectPillarboxContentAspect(
            source,
            source.naturalWidth,
            source.naturalHeight,
          );
          if (aspect != null) {
            setContentAspectHint(aspect);
          }
        });
      };

      const img = new window.Image();
      img.decoding = 'async';
      img.crossOrigin = 'anonymous';
      img.onload = () => scan(img);
      img.onerror = () => {
        // Same-origin Next image optimizer as fallback when Sanity CORS fails.
        if (cancelled || img.src.includes('/_next/image')) return;
        const proxy = new window.Image();
        proxy.onload = () => scan(proxy);
        proxy.src = `/_next/image?url=${encodeURIComponent(scanUrl)}&w=960&q=75`;
      };
      img.src = scanUrl;

      return () => {
        cancelled = true;
        cancelIdle();
      };
    }, [slide.posterUrl, slide.posterUrlDesktop]);

    const mediaStackStyle =
      contentAspectHint != null
        ? ({
            '--vp-preview-aspect': String(contentAspectHint),
          } as CSSProperties)
        : undefined;

    return (
      <article
        ref={ref}
        className="vp-proto-carousel__slide"
        aria-hidden={!active}
        data-index={index}
      >
        <div className="vp-proto-carousel__media">
          <div
            className="vp-proto-carousel__media-stack"
            style={mediaStackStyle}
          >
            {slide.posterUrl && !playerReady ? (
              <div className="vp-proto-carousel__poster-shell">
                <picture>
                  {slide.posterUrlDesktop ? (
                    <source
                      media="(min-width: 768px)"
                      srcSet={slide.posterUrlDesktop}
                    />
                  ) : null}
                  <img
                    src={slide.posterUrl}
                    alt=""
                    className="vp-proto-carousel__poster"
                    decoding="async"
                    loading="eager"
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    style={{objectPosition: slide.objectPosition}}
                  />
                </picture>
              </div>
            ) : null}
            {shouldMountVideo && slide.vimeoUrl ? (
              <CarouselVimeo
                vimeoUrl={slide.vimeoUrl}
                active={active}
                previewStartSeconds={slide.previewStartSeconds}
                previewEndSeconds={slide.previewEndSeconds}
                contentAspectHint={contentAspectHint}
                onReadyChange={setPlayerReady}
              />
            ) : null}
          </div>
        </div>

        <div className="vp-proto-carousel__overlay">
          <div className="vp-proto-carousel__overlay-scrim" aria-hidden />
          <div className="vp-proto-carousel__overlay-copy">
            <div className="vp-proto-carousel__overlay-main">
              <div className="vp-proto-carousel__brand-row">
                <p className="vp-proto-carousel__brand">{slide.brandLine}</p>
                {slide.formatLine ? (
                  <p className="vp-proto-carousel__format">{slide.formatLine}</p>
                ) : null}
              </div>
              <h2 className="vp-proto-carousel__campaign">{slide.campaignLine}</h2>
            </div>
            <dl className="vp-proto-carousel__credits">
              <div className="vp-proto-carousel__credit">
                <dt>Director</dt>
                <dd>{slide.directorNames}</dd>
              </div>
              <div className="vp-proto-carousel__credit">
                <dt>DOP</dt>
                <dd>{slide.dopNames}</dd>
              </div>
            </dl>
          </div>
        </div>

        {portfolioSlug ? (
          <PortfolioEntryLink
            slug={portfolioSlug}
            className={`vp-proto-carousel__card-link${
              interactive ? ' is-active' : ''
            }`}
            aria-label={
              [slide.brandLine, slide.campaignLine].filter(Boolean).join(' — ') ||
              undefined
            }
            tabIndex={interactive ? undefined : -1}
            aria-hidden={!interactive}
            draggable={false}
            onPointerDown={onCardPointerDown}
            onClick={onCardLinkClick}
            showPendingHint
          />
        ) : null}
      </article>
    );
  },
);
