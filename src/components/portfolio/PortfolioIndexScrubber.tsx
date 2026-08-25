'use client';

/**
 * /work index scrubber — bidirectional speed/throttle (center = stop).
 * Drives Embla's scroll body like a drag gesture for smooth snap animation.
 */

import {useCallback, useEffect, useRef, useState, type PointerEvent} from 'react';
import type {EmblaCarouselType} from 'embla-carousel';
import {nearestSnapIndexFromProgress} from './nearest-snap-from-progress';

const TICK_COUNT = 48;

/** Tunable after device testing — snap-widths scrolled per second at full deflection. */
const MAX_SNAP_WIDTHS_PER_SECOND = 8;

const DEAD_ZONE = 0.08;
const POWER_EXPONENT = 1.6;
const NEUTRAL_THUMB_PERCENT = 50;

/** Matches Embla DragHandler.move — smooth follow while scrubbing. */
const SCRUB_MOVE_FRICTION = 0.3;
const SCRUB_MOVE_DURATION = 0.75;

type EmblaEngine = ReturnType<EmblaCarouselType['internalEngine']>;

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

function averageSnapDistance(engine: EmblaEngine): number {
  const {scrollSnaps, containerRect} = engine;
  if (scrollSnaps.length < 2) {
    return containerRect.width || 1;
  }
  let total = 0;
  for (let i = 1; i < scrollSnaps.length; i++) {
    total += Math.abs(scrollSnaps[i] - scrollSnaps[i - 1]);
  }
  return total / (scrollSnaps.length - 1);
}

function syncEngineToLocation(engine: EmblaEngine) {
  engine.scrollBody.useFriction(0).useDuration(0);
  engine.target.set(engine.location.get());
}

function settleToNearestSnap(emblaApi: EmblaCarouselType) {
  const engine = emblaApi.internalEngine();
  engine.scrollBody.useFriction(0).useDuration(0);
  engine.target.set(engine.location.get());

  const snaps = emblaApi.scrollSnapList();
  if (snaps.length <= 1) return;

  emblaApi.scrollTo(
    nearestSnapIndexFromProgress(
      emblaApi.scrollProgress(),
      snaps,
      Boolean(emblaApi.internalEngine().options.loop),
    ),
    false,
  );
}

export function PortfolioIndexScrubber({
  snapCount,
  emblaApi,
}: PortfolioIndexScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const deflectionRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [thumbPercent, setThumbPercent] = useState(NEUTRAL_THUMB_PERCENT);
  const [isReturning, setIsReturning] = useState(false);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = null;
  }, []);

  const applyScrollDelta = useCallback(
    (engine: EmblaEngine, deltaScroll: number) => {
      if (deltaScroll === 0) return;
      engine.scrollBody.useFriction(SCRUB_MOVE_FRICTION).useDuration(SCRUB_MOVE_DURATION);
      engine.animation.start();
      engine.target.add(engine.axis.direction(deltaScroll));
    },
    [],
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
        const engine = emblaApi.internalEngine();
        const snapDistance = averageSnapDistance(engine);
        const deltaScroll =
          -direction * m * MAX_SNAP_WIDTHS_PER_SECOND * snapDistance * deltaSeconds;
        applyScrollDelta(engine, deltaScroll);
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [applyScrollDelta, emblaApi, stopLoop],
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
    setIsReturning(false);
    setThumbPercent(thumbPercentFromDeflection(d));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (snapCount <= 1 || !emblaApi) return;
    event.preventDefault();
    draggingRef.current = true;
    setIsReturning(false);
    syncEngineToLocation(emblaApi.internalEngine());
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
    if (emblaApi) {
      settleToNearestSnap(emblaApi);
    }
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore
    }
    setIsReturning(true);
    setThumbPercent(NEUTRAL_THUMB_PERCENT);
  };

  useEffect(() => () => stopLoop(), [stopLoop]);

  return (
    <div
      className={`vp-portfolio-index__scrubber${
        snapCount <= 1 ? ' is-inert' : ''
      }`}
      role="group"
      aria-label="Scroll speed control"
      aria-disabled={snapCount <= 1 || !emblaApi}
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
          className={`vp-portfolio-index__scrubber-thumb${
            isReturning ? ' is-returning' : ''
          }`}
          style={{left: `${thumbPercent}%`}}
          aria-hidden
        />
      </div>
    </div>
  );
}
