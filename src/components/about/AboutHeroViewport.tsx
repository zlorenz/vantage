'use client';

/**
 * About hero — full-viewport symbol loupe (same stage as /prototype/footer-lens).
 * Keeps the statement block below the fold on initial page load.
 */

import {FooterLensStage} from '@/components/prototype/footer-lens/FooterLensStage';
import './about-hero-viewport.css';

export function AboutHeroViewport() {
  return (
    <section className="vp-about-hero" aria-label="Vantage symbol">
      <FooterLensStage className="vp-about-hero__lens" />
    </section>
  );
}
