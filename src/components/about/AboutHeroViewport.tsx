/**
 * About hero — full-viewport symbol with mirrored VAP pattern corners.
 * Keeps the statement block below the fold on initial page load.
 *
 * Pattern source: design/assets/pattern/VAP_Pattern.svg (served from /brand/vap-pattern.svg).
 */

import './about-hero-viewport.css';

/** Cropped viewBox of VAP_Pattern.svg — matches public/brand/vap-pattern.svg. */
const VAP_PATTERN = {
  src: '/brand/vap-pattern.svg',
  width: 2074,
  height: 1083,
} as const;

export function AboutHeroViewport() {
  return (
    <section className="vp-about-hero" aria-hidden>
      <div className="vp-about-hero__symbol">
        <img
          src="/brand/vantage-logo.svg"
          alt=""
          className="vp-about-hero__symbol-img"
          decoding="async"
        />
      </div>
      <img
        src={VAP_PATTERN.src}
        alt=""
        width={VAP_PATTERN.width}
        height={VAP_PATTERN.height}
        className="vp-about-hero__pattern vp-about-hero__pattern--right"
        decoding="async"
      />
      <img
        src={VAP_PATTERN.src}
        alt=""
        width={VAP_PATTERN.width}
        height={VAP_PATTERN.height}
        className="vp-about-hero__pattern vp-about-hero__pattern--left"
        decoding="async"
      />
    </section>
  );
}
