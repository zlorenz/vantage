'use client';

/**
 * /work index scrubber — bidirectional speed/throttle (center = stop).
 * rAF accumulator drives public scrollNext(true)/scrollPrev(true).
 */

import {useCallback, useEffect, useRef, useState, type PointerEvent} from 'react';
import type {EmblaCarouselType} from 'embla-carousel';

const TICK_COUNT = 48;

/** Tunable after device testing — max snap steps per second at full deflection. */
const MAX_SNAPS_PER_SECOND = 12;

const DEAD_ZONE = 0.08;
const POWER_EXPONENT = 1.6;
const NEUTRAL_THUMB_PERCENT = 50;

type PortfolioIndexScrubberProps = {
  /** Filtered snap/slide count (same as Embla snap count for this carousel). */
  snapCount: number;
  emblaApi: EmblaCarouselType | undefined;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function deflectionFromClientX(clientX: number, track: HTMLElement): number {
  const rect = track.getBoundingClientRect();
  const center = rect.left + rect.width / 2;
  const halfWidth = rect.width / 2;
  if (halfWidth <= 0) return 0;
  return clamp((clientX - center) / halfWidth, -1, 1);
}

function magnitudeFromDeflection(d: number): number {
  const abs = Math.abs(d);
  if (abs < DEAD_ZONE) return 0;
  return ((abs - DEAD_ZONE) / (1 - DEAD_ZONE)) ** POWER_EXPONENT;
}

function thumbPercentFromDeflection(d: number): number {
  return NEUTRAL_THUMB_PERCENT + d * 50;
}

export function PortfolioIndexScrubber({
  snapCount,
  emblaApi,
}: PortfolioIndexScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const deflectionRef = useRef(0);
  const accumulatorRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [thumbPercent, setThumbPercent] = useState(NEUTRAL_THUMB_PERCENT);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = null;
    accumulatorRef.current = 0;
  }, []);

  const advanceOneStep = useCallback(
    (direction: number) => {
      if (!emblaApi || direction === 0) return false;

      if (direction > 0) {
        if (!emblaApi.canScrollNext()) return false;
        emblaApi.scrollNext(true);
        return true;
      }

      if (!emblaApi.canScrollPrev()) return false;
      emblaApi.scrollPrev(true);
      return true;
    },
    [emblaApi],
  );

  const tick = useCallback(
    (timestamp: number) => {
      if (!draggingRef.current || !emblaApi) {
        stopLoop();
        return;
      }

      const last = lastFrameRef.current ?? timestamp;
      lastFrameRef.current = timestamp;
      const deltaSeconds = Math.min((timestamp - last) / 1000, 0.05);

      const d = deflectionRef.current;
      const m = magnitudeFromDeflection(d);
      const direction = Math.sign(d);

      if (m > 0 && direction !== 0) {
        accumulatorRef.current += m * MAX_SNAPS_PER_SECOND * deltaSeconds;

        while (accumulatorRef.current >= 1) {
          const advanced = advanceOneStep(direction);
          if (!advanced) {
            accumulatorRef.current = 0;
            break;
          }
          accumulatorRef.current -= 1;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [advanceOneStep, emblaApi, stopLoop],
  );

  const startLoop = useCallback(() => {
    stopLoop();
    rafRef.current = requestAnimationFrame(tick);
  }, [stopLoop, tick]);

  const updateDeflection = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const d = deflectionFromClientX(clientX, track);
    deflectionRef.current = d;
    setThumbPercent(thumbPercentFromDeflection(d));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (snapCount <= 1 || !emblaApi) return;
    event.preventDefault();
    draggingRef.current = true;
    updateDeflection(event.clientX);
    startLoop();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Untrusted / synthetic events may reject capture.
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateDeflection(event.clientX);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    deflectionRef.current = 0;
    stopLoop();
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore
    }
    setThumbPercent(NEUTRAL_THUMB_PERCENT);
  };

  useEffect(() => () => stopLoop(), [stopLoop]);

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
      <div
        ref={trackRef}
        className="vp-portfolio-index__scrubber-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
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
          style={{left: `${thumbPercent}%`}}
          aria-hidden
        />
      </div>
    </div>
  );
}
