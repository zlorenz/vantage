'use client';

import {
  forwardRef,
  useEffect,
  useState,
  type CSSProperties,
} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
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
  /** After a loop-wrap teleport, Explore (and desktop Watch) stay inert
   *  briefly so a stray tap does not consume a touch meant as the next swipe. */
  blockExplore?: boolean;
  mountPlayer: boolean;
}

export const CarouselSlide = forwardRef<HTMLElement, CarouselSlideProps>(
  function CarouselSlide({slide, index, active, blockExplore = false, mountPlayer}, ref) {
    const t = useTranslations('Home');
    const locale = useLocale();
    const [playerReady, setPlayerReady] = useState(false);
    const [contentAspectHint, setContentAspectHint] = useState<number | null>(
      null,
    );
    const portfolioHref = slide.hrefSlug
      ? ({
          pathname: '/portfolio/[slug]' as const,
          params: {slug: slide.hrefSlug},
        } as const)
      : null;
    const interactive = active && !blockExplore;
    // ZH: static featuredImage poster only — no Vimeo/XPC preview (autoplay unreliable).
    const allowVideoPreview = locale !== 'zh';
    const shouldMountVideo = allowVideoPreview && mountPlayer && Boolean(slide.vimeoUrl);

    useEffect(() => {
      if (!shouldMountVideo) {
        setPlayerReady(false);
      }
    }, [shouldMountVideo]);

    // Desktop-only: scan the poster for baked-in side bars. Mobile keeps
    // fill + object-fit cover — canvas scans during swipe janked Embla.
    useEffect(() => {
      if (!slide.posterUrl || !isCarouselCoverMathEnabled()) {
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
        proxy.src = `/_next/image?url=${encodeURIComponent(slide.posterUrl!)}&w=960&q=75`;
      };
      img.src = slide.posterUrl;

      return () => {
        cancelled = true;
        cancelIdle();
      };
    }, [slide.posterUrl]);

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
              {portfolioHref ? (
                <Link
                  href={portfolioHref}
                  className={`vp-proto-carousel__explore ${
                    interactive ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                  tabIndex={interactive ? undefined : -1}
                >
                  {t('exploreButton')}
                  <span className="vp-proto-carousel__explore-caret" aria-hidden>
                    <svg
                      className="vp-proto-carousel__explore-caret-icon"
                      viewBox="7 4 12 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 6L16 12L9 18"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </svg>
                  </span>
                </Link>
              ) : null}
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

          {portfolioHref ? (
            <Link
              href={portfolioHref}
              className={`vp-proto-carousel__watch ${
                interactive ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              aria-label="Watch"
              tabIndex={interactive ? undefined : -1}
            >
              <span className="vp-proto-carousel__watch-cluster">
                <span className="vp-proto-carousel__watch-label-mask">
                  <span className="vp-proto-carousel__watch-label">Watch</span>
                </span>
                <span className="vp-proto-carousel__watch-caret" aria-hidden>
                  <svg
                    className="vp-proto-carousel__watch-caret-icon"
                    viewBox="7 4 12 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 6L16 12L9 18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </span>
              </span>
            </Link>
          ) : null}
        </div>
      </article>
    );
  },
);
