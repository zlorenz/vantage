'use client';

/**
 * About hero — full-viewport symbol with Figma copy overlays.
 * Desktop: loupe-clipped quote cards + cursor-tracked chrome.
 * Mobile: idle glass mark + scroll-driven gradient; no loupe, no hotspots.
 *
 * Loupe quote cards are temporarily hidden (placeholder copy). Flip
 * SHOW_HERO_QUOTES when final quotes are ready.
 */

import {useTranslations} from 'next-intl';
import {type CSSProperties} from 'react';
import {CornerFrame} from '@/components/ui/CornerFrame';
import {AboutLensStage} from '@/components/about/symbol-lens/AboutLensStage';
import './about-hero-viewport.css';

/** Temporary launch hide — restore when hero quote copy is final. */
const SHOW_HERO_QUOTES = false;

/**
 * Midway between the Figma-near spots and the outer-edge park, then nudged
 * 15% toward the viewport midpoint — clear of the mark under loupe mag,
 * without colliding with the nav.
 */
const QUOTE_SLOTS = [
  {side: 'left', inset: 9.4, top: 17.7},
  {side: 'left', inset: 8.7, top: 56},
  {side: 'right', inset: 9.4, top: 15.2},
  {side: 'right', inset: 8.9, top: 61.9},
] as const;

export function AboutHeroViewport() {
  const t = useTranslations('About');
  const quote = t('heroQuote');

  return (
    <section className="vp-about-hero" aria-label="Vantage symbol">
      <AboutLensStage className="vp-about-hero__lens" />

      {SHOW_HERO_QUOTES ? (
        <div className="vp-about-hero__quotes" aria-hidden="true">
          {QUOTE_SLOTS.map((slot, index) => (
            <div
              key={index}
              className={`vp-about-hero__quote vp-about-hero__quote--${slot.side}`}
              style={
                {
                  '--vp-about-hero-quote-inset': `${slot.inset}%`,
                  '--vp-about-hero-quote-top': `${slot.top}%`,
                } as CSSProperties
              }
            >
              <CornerFrame variant="dark" />
              <p className="vp-about-hero__quote-text">{quote}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="vp-about-hero__copy">
        <p className="vp-about-hero__title">{t('heroTitle')}</p>
        <p className="vp-about-hero__caption">{t('heroCaption')}</p>
      </div>

      {/* Decorative scroll cue — not interactive (for now). */}
      <div className="vp-about-hero__scroll" aria-hidden="true">
        <svg
          className="vp-about-hero__scroll-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4.5V17.5M12 17.5L6.5 12M12 17.5L17.5 12"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
