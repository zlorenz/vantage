'use client';

/**
 * Prototype playground for the symbol loupe — isolated route only.
 * About page uses FooterLensStage via AboutHeroViewport.
 */

import {FooterLensStage} from './FooterLensStage';
import './footer-lens.css';

export function FooterLensPrototype() {
  return (
    <div className="vp-footer-lens-proto">
      <p className="vp-footer-lens-proto__hint">
        Hover the symbol — photo collage reveal + brand gradient warp.
        Prototype for the About hero. Prototype only.
      </p>
      <div className="vp-footer-lens-proto__stage">
        <FooterLensStage />
      </div>
    </div>
  );
}
