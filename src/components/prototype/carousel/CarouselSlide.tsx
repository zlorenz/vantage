'use client';

import {forwardRef, useEffect, useRef, useState} from 'react';
import Image from 'next/image';
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
    const [playerReady, setPlayerReady] = useState(false);
    const [hasPlaying, setHasPlaying] = useState(false);
    const wasActiveRef = useRef(active);
    const skipPosterThisActivationRef = useRef(false);

    if (active !== wasActiveRef.current) {
      skipPosterThisActivationRef.current = active && playerReady;
      wasActiveRef.current = active;
    }

    if (!active && hasPlaying) {
      setHasPlaying(false);
    }

    useEffect(() => {
      if (!mountPlayer) {
        setPlayerReady(false);
        setHasPlaying(false);
      }
    }, [mountPlayer]);

    const hidePoster =
      active && (skipPosterThisActivationRef.current || hasPlaying);

    return (
      <article
        ref={ref}
        className="vp-proto-carousel__slide"
        aria-hidden={!active}
        data-index={index}
      >
        <div className="vp-proto-carousel__media">
          {slide.posterUrl && !hidePoster ? (
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
              onPlaying={() => setHasPlaying(true)}
            />
          ) : null}
        </div>

        <div className="vp-proto-carousel__overlay">
          <p className="vp-proto-carousel__brand">{slide.brandLine}</p>
          <h2 className="vp-proto-carousel__campaign">{slide.campaignLine}</h2>
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
      </article>
    );
  },
);
