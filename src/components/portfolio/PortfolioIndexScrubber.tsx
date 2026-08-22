'use client';

/**
 * /work index scrubber — decorative tick track + pill thumb.
 * Thumb position follows activeIndex / (snapCount - 1); drag-to-seek is next.
 */

const TICK_COUNT = 48;

type PortfolioIndexScrubberProps = {
  activeIndex: number;
  /** Filtered snap/slide count (same as Embla snap count for this carousel). */
  snapCount: number;
};

function thumbProgress(activeIndex: number, snapCount: number): number {
  if (snapCount <= 1) return 0;
  const clamped = Math.min(Math.max(activeIndex, 0), snapCount - 1);
  return clamped / (snapCount - 1);
}

export function PortfolioIndexScrubber({
  activeIndex,
  snapCount,
}: PortfolioIndexScrubberProps) {
  const progress = thumbProgress(activeIndex, snapCount);

  return (
    <div className="vp-portfolio-index__scrubber" aria-hidden>
      <div className="vp-portfolio-index__scrubber-track">
        <div className="vp-portfolio-index__scrubber-ticks">
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
        />
      </div>
    </div>
  );
}
