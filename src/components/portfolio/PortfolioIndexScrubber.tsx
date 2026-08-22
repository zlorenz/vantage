'use client';

/**
 * /work index scrubber — tick track + pill thumb.
 * Thumb follows activeIndex; drag seeks via scrollSnapList → scrollTo.
 */

import {useCallback, useRef, useState, type PointerEvent} from 'react';
import type {EmblaCarouselType} from 'embla-carousel';

const TICK_COUNT = 48;

type PortfolioIndexScrubberProps = {
  activeIndex: number;
  /** Filtered snap/slide count (same as Embla snap count for this carousel). */
  snapCount: number;
  emblaApi: EmblaCarouselType | undefined;
};

function thumbProgress(activeIndex: number, snapCount: number): number {
  if (snapCount <= 1) return 0;
  const clamped = Math.min(Math.max(activeIndex, 0), snapCount - 1);
  return clamped / (snapCount - 1);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function nearestSnapIndex(progress: number, snaps: number[]): number {
  if (snaps.length <= 1) return 0;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < snaps.length; i++) {
    const dist = Math.abs(snaps[i] - progress);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export function PortfolioIndexScrubber({
  activeIndex,
  snapCount,
  emblaApi,
}: PortfolioIndexScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);

  const progress =
    dragProgress ?? thumbProgress(activeIndex, snapCount);

  const progressFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return clamp01((clientX - rect.left) / rect.width);
  }, []);

  const seekToProgress = useCallback(
    (nextProgress: number) => {
      if (!emblaApi || snapCount <= 1) return;
      const snaps = emblaApi.scrollSnapList();
      if (!snaps.length) return;
      const index = nearestSnapIndex(nextProgress, snaps);
      emblaApi.scrollTo(index);
    },
    [emblaApi, snapCount],
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (snapCount <= 1 || !emblaApi) return;
    event.preventDefault();
    draggingRef.current = true;
    const next = progressFromClientX(event.clientX);
    setDragProgress(next);
    seekToProgress(next);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Untrusted / synthetic events may reject capture; seek still applied above.
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const next = progressFromClientX(event.clientX);
    setDragProgress(next);
    seekToProgress(next);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore
    }
    setDragProgress(null);
  };

  return (
    <div
      className={`vp-portfolio-index__scrubber${
        snapCount <= 1 ? ' is-inert' : ''
      }`}
      role="slider"
      aria-label="Seek portfolio slides"
      aria-valuemin={1}
      aria-valuemax={Math.max(snapCount, 1)}
      aria-valuenow={Math.min(activeIndex + 1, Math.max(snapCount, 1))}
      aria-disabled={snapCount <= 1 || !emblaApi}
      tabIndex={snapCount <= 1 || !emblaApi ? -1 : 0}
      onKeyDown={(event) => {
        if (!emblaApi || snapCount <= 1) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault();
          emblaApi.scrollNext();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault();
          emblaApi.scrollPrev();
        } else if (event.key === 'Home') {
          event.preventDefault();
          emblaApi.scrollTo(0);
        } else if (event.key === 'End') {
          event.preventDefault();
          emblaApi.scrollTo(snapCount - 1);
        }
      }}
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
          style={{left: `${progress * 100}%`}}
          aria-hidden
        />
      </div>
    </div>
  );
}
