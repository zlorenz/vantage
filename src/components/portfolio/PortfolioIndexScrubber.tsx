'use client';

/**
 * /work index scrubber — decorative tick track + pill thumb.
 * Visual-only for now; position/seek wiring lands in follow-up commits.
 */

const TICK_COUNT = 48;

export function PortfolioIndexScrubber() {
  return (
    <div
      className="vp-portfolio-index__scrubber"
      aria-hidden
    >
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
          style={{left: '0%'}}
        />
      </div>
    </div>
  );
}
