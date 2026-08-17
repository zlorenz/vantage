'use client';

import {forwardRef, useEffect, useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {VpButton} from '@/components/ui/VpButton';
import {CarouselVimeo} from './CarouselVimeo';
import type {PrototypeCarouselSlide} from './types';

interface CarouselSlideProps {
  slide: PrototypeCarouselSlide;
  index: number;
  active: boolean;
  mountPlayer: boolean;
}

export const CarouselSlide = forwardRef<HTMLElement, CarouselSlideProps>(
  function CarouselSlide({slide, index, active, mountPlayer}, ref) {
    const t = useTranslations('Home');
    const [playerReady, setPlayerReady] = useState(false);

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

        <div className="vp-proto-carousel__overlay">
          <div className="vp-proto-carousel__overlay-scrim" aria-hidden />
          <div className="vp-proto-carousel__overlay-copy">
            <div className="vp-proto-carousel__overlay-main">
              <p className="vp-proto-carousel__brand">{slide.brandLine}</p>
              <h2 className="vp-proto-carousel__campaign">{slide.campaignLine}</h2>
              {slide.hrefSlug ? (
                <VpButton
                  href={{
                    pathname: '/portfolio/[slug]',
                    params: {slug: slide.hrefSlug},
                  }}
                  variant="ghost"
                  className={`vp-proto-carousel__explore mt-2 w-fit ${
                    active ? 'pointer-events-auto' : 'pointer-events-none'
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
              <div className="vp-proto-carousel__credit">
                <dt>Format</dt>
                <dd>{slide.formatLine}</dd>
              </div>
            </dl>
          </div>
        </div>
      </article>
    );
  },
);
