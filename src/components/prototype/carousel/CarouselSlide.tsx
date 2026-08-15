'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import { CarouselVimeo } from './CarouselVimeo';
import type { PrototypeCarouselSlide } from './types';

interface CarouselSlideProps {
  slide: PrototypeCarouselSlide;
  index: number;
  active: boolean;
  mountPlayer: boolean;
}

export const CarouselSlide = forwardRef<HTMLElement, CarouselSlideProps>(
  function CarouselSlide({ slide, index, active, mountPlayer }, ref) {
    return (
      <article
        ref={ref}
        className="vp-proto-carousel__slide"
        aria-hidden={!active}
        data-index={index}
      >
        <div className="vp-proto-carousel__media">
          {slide.posterUrl ? (
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
            <CarouselVimeo vimeoUrl={slide.vimeoUrl} active={active} />
          ) : null}
        </div>

        <div className="vp-proto-carousel__overlay">
          <h2
            className="vp-proto-carousel__title"
            dangerouslySetInnerHTML={{ __html: slide.titleHtml }}
          />
          <p className="vp-proto-carousel__stub">
            Parallax text overlay — follow-up
          </p>
        </div>
      </article>
    );
  },
);
