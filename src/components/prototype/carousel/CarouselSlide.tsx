'use client';

import {forwardRef, useEffect, useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {VpButton} from '@/components/ui/VpButton';
import {CarouselVimeo} from './CarouselVimeo';
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

/** Rounded play-triangle path in objectBoundingBox units (0–1). */
const WATCH_CLIP_PATH =
  'M0.78 0.50 C0.78 0.54 0.75 0.58 0.71 0.60 L0.24 0.88 C0.16 0.93 0.10 0.88 0.10 0.80 L0.10 0.20 C0.10 0.12 0.16 0.07 0.24 0.12 L0.71 0.40 C0.75 0.42 0.78 0.46 0.78 0.50 Z';

export const CarouselSlide = forwardRef<HTMLElement, CarouselSlideProps>(
  function CarouselSlide({slide, index, active, blockExplore = false, mountPlayer}, ref) {
    const t = useTranslations('Home');
    const [playerReady, setPlayerReady] = useState(false);
    const watchClipId = `vp-proto-watch-clip-${slide.slug}`;
    const portfolioHref = slide.hrefSlug
      ? ({
          pathname: '/portfolio/[slug]' as const,
          params: {slug: slide.hrefSlug},
        } as const)
      : null;
    const interactive = active && !blockExplore;

    useEffect(() => {
      if (!mountPlayer) {
        setPlayerReady(false);
      }
    }, [mountPlayer]);

    return (
      <article
        ref={ref}
        className="vp-proto-carousel__slide"
        aria-hidden={!active}
        data-index={index}
      >
        <div className="vp-proto-carousel__media">
          <div className="vp-proto-carousel__media-stack">
            {slide.posterUrl && !playerReady ? (
              <Image
                src={slide.posterUrl}
                alt=""
                fill
                loading="eager"
                priority={index === 0}
                className="vp-proto-carousel__poster"
                sizes="100vw"
              />
            ) : null}
            {mountPlayer && slide.vimeoUrl ? (
              <CarouselVimeo
                vimeoUrl={slide.vimeoUrl}
                active={active}
                previewStartSeconds={slide.previewStartSeconds}
                previewEndSeconds={slide.previewEndSeconds}
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
                <VpButton
                  href={portfolioHref}
                  variant="ghost"
                  className={`vp-proto-carousel__explore mt-2 w-fit ${
                    interactive ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                >
                  {t('exploreButton')}
                </VpButton>
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
              <svg className="vp-proto-carousel__watch-defs" aria-hidden width="0" height="0">
                <defs>
                  <clipPath id={watchClipId} clipPathUnits="objectBoundingBox">
                    <path d={WATCH_CLIP_PATH} />
                  </clipPath>
                </defs>
              </svg>
              <span className="vp-proto-carousel__watch-cluster">
                <span className="vp-proto-carousel__watch-label-mask">
                  <span className="vp-proto-carousel__watch-label">Watch</span>
                </span>
                <span className="vp-proto-carousel__watch-glass-wrap" aria-hidden>
                  <span
                    className="vp-proto-carousel__watch-glass"
                    style={{clipPath: `url(#${watchClipId})`}}
                  />
                </span>
              </span>
            </Link>
          ) : null}
        </div>
      </article>
    );
  },
);
