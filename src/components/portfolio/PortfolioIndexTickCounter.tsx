'use client';

/**
 * Desktop tick-marked slide readout (Figma 78:30581 / 78:30463).
 * Fixed to the viewport bottom; aligns cells under live card boxes.
 * Non-interactive — PortfolioIndexScrubber remains the only bottom control.
 */

import {useCallback, useEffect, useState} from 'react';
import type {EmblaCarouselType} from 'embla-carousel';
import './portfolio-index-tick-counter.css';

/** Figma pitch between 1px ticks (16px left-edge spacing → 15px gap). */
const TICK_PITCH_PX = 16;

type CellLayout = {
  index: number;
  left: number;
  width: number;
};

type PortfolioIndexTickCounterProps = {
  activeIndex: number;
  slideCount: number;
  emblaApi: EmblaCarouselType | undefined;
};

function formatSlideLabel(index: number): string {
  const n = index + 1;
  return `( ${String(n).padStart(2, '0')} )`;
}

function ticksForWidth(width: number): {offset: number; major: boolean}[] {
  if (width <= 0) return [];
  const center = width / 2;
  const ticks: {offset: number; major: boolean}[] = [];
  // Snap major to the pitch step nearest cell center (Figma major at mid-cell).
  const majorOffset =
    Math.round(center / TICK_PITCH_PX) * TICK_PITCH_PX;
  for (let x = 0; x <= width + 0.5; x += TICK_PITCH_PX) {
    ticks.push({
      offset: x,
      major: Math.abs(x - majorOffset) < 0.5,
    });
  }
  return ticks;
}

export function PortfolioIndexTickCounter({
  activeIndex,
  slideCount,
  emblaApi,
}: PortfolioIndexTickCounterProps) {
  const [cells, setCells] = useState<CellLayout[]>([]);

  const measure = useCallback(() => {
    if (!emblaApi || slideCount <= 0) {
      setCells([]);
      return;
    }
    const root = emblaApi.rootNode();
    const slideNodes = root.querySelectorAll<HTMLElement>(
      '.vp-portfolio-index__slide[data-index]',
    );
    const next: CellLayout[] = [];
    slideNodes.forEach((slide) => {
      const raw = slide.dataset.index;
      if (raw == null) return;
      const index = Number(raw);
      if (!Number.isFinite(index) || index < 0 || index >= slideCount) return;
      const card =
        slide.querySelector('.vp-portfolio-index__card') ?? slide;
      const rect = card.getBoundingClientRect();
      if (rect.width < 8) return;
      if (rect.right < -80 || rect.left > window.innerWidth + 80) return;
      next.push({
        index,
        left: rect.left,
        width: rect.width,
      });
    });
    setCells(next);
  }, [emblaApi, slideCount]);

  useEffect(() => {
    if (!emblaApi) return;
    measure();
    emblaApi.on('scroll', measure);
    emblaApi.on('reInit', measure);
    emblaApi.on('select', measure);
    window.addEventListener('resize', measure);
    return () => {
      emblaApi.off('scroll', measure);
      emblaApi.off('reInit', measure);
      emblaApi.off('select', measure);
      window.removeEventListener('resize', measure);
    };
  }, [emblaApi, measure]);

  if (slideCount <= 0) return null;

  return (
    <>
      <p
        className="vp-portfolio-index__tick-counter-live"
        aria-live="polite"
        aria-atomic="true"
      >
        {activeIndex + 1} / {slideCount}
      </p>
      <div className="vp-portfolio-index__tick-counter" aria-hidden="true">
        {cells.map((cell, slot) => {
          const active = cell.index === activeIndex;
          const ticks = ticksForWidth(cell.width);
          return (
            <div
              key={`${cell.index}-${slot}-${Math.round(cell.left)}`}
              className={`vp-portfolio-index__tick-counter-cell${
                active ? ' is-active' : ''
              }`}
              style={{
                left: cell.left,
                width: cell.width,
              }}
            >
              <span className="vp-portfolio-index__tick-counter-label">
                {formatSlideLabel(cell.index)}
              </span>
              <div className="vp-portfolio-index__tick-counter-ticks">
                {ticks.map((tick) => (
                  <span
                    key={tick.offset}
                    className={`vp-portfolio-index__tick-counter-tick${
                      tick.major ? ' is-major' : ''
                    }`}
                    style={{left: tick.offset}}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
