'use client';

/**
 * About hero — full-viewport symbol loupe with Figma copy overlays.
 * Desktop: loupe-clipped quote cards + side-by-side chrome.
 * Mobile: hotspot dots open a tooltip; title/caption stack (Figma 2602:26414).
 */

import {useTranslations} from 'next-intl';
import {useEffect, useState, type CSSProperties} from 'react';
import {CornerFrame} from '@/components/ui/CornerFrame';
import {FooterLensStage} from '@/components/prototype/footer-lens/FooterLensStage';
import './about-hero-viewport.css';

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

/** Mobile hotspot dots — Figma 2602:26414 / 2602:29252 (402×874 artboard). */
const HOTSPOTS = [
  {left: 63.2, top: 30.9},
  {left: 24.4, top: 41.4},
  {left: 14.2, top: 53.9},
  {left: 82.8, top: 56.3},
] as const;

export function AboutHeroViewport() {
  const t = useTranslations('About');
  const quote = t('heroQuote');
  const [openHotspot, setOpenHotspot] = useState<number | null>(null);

  useEffect(() => {
    if (openHotspot === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenHotspot(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openHotspot]);

  return (
    <section className="vp-about-hero" aria-label="Vantage symbol">
      <FooterLensStage className="vp-about-hero__lens" />

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

      <div className="vp-about-hero__hotspots">
        {HOTSPOTS.map((spot, index) => {
          const open = openHotspot === index;
          return (
            <button
              key={index}
              type="button"
              className={`vp-about-hero__hotspot${open ? ' is-open' : ''}`}
              style={{left: `${spot.left}%`, top: `${spot.top}%`}}
              aria-expanded={open}
              aria-controls="vp-about-hero-tooltip"
              aria-label={open ? 'Hide quote' : 'Show quote'}
              onClick={() => setOpenHotspot((current) => (current === index ? null : index))}
            />
          );
        })}
        {openHotspot !== null ? (
          <div id="vp-about-hero-tooltip" className="vp-about-hero__tooltip" role="dialog">
            <CornerFrame variant="dark" />
            <p className="vp-about-hero__tooltip-text">{quote}</p>
          </div>
        ) : null}
      </div>

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

      <div className="vp-about-hero__frame" aria-hidden="true">
        <CornerFrame variant="dark" />
      </div>
    </section>
  );
}
