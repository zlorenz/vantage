'use client';

/**
 * /work index scrubber — tick track + pill thumb (speed control wiring follows).
 */

import type {EmblaCarouselType} from 'embla-carousel';

const TICK_COUNT = 48;

type PortfolioIndexScrubberProps = {
  /** Filtered snap/slide count (same as Embla snap count for this carousel). */
  snapCount: number;
  emblaApi: EmblaCarouselType | undefined;
};

export function PortfolioIndexScrubber({
  snapCount,
  emblaApi,
}: PortfolioIndexScrubberProps) {
  return (
    <div
      className={`vp-portfolio-index__scrubber${
        snapCount <= 1 ? ' is-inert' : ''
      }`}
      role="slider"
      aria-label="Seek portfolio slides"
      aria-disabled={snapCount <= 1 || !emblaApi}
      tabIndex={snapCount <= 1 || !emblaApi ? -1 : 0}
    >
      <div className="vp-portfolio-index__scrubber-track">
        <div className="vp-portfolio-index__scrubber-ticks" aria-hidden>
          {Array.from({length: TICK_COUNT}, (_, i) => (
            <span
              key={i}
              className={`vp-portfolio-index__scrubber-tick${
                i % 6 === 0 ? ' is-major' : ''
              }`}
            />
          ))}
        </div>
        <div
          className="vp-portfolio-index__scrubber-thumb"
          style={{left: '50%'}}
          aria-hidden
        />
      </div>
    </div>
  );
}
