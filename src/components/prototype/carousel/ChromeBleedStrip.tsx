'use client';

/**
 * In-flow black strip between the homepage carousel and contact section.
 * Height from --vp-chrome-bleed (fixed 64px, synced on mount + orientationchange).
 */

import { useEffect } from 'react';
import { syncVpChromeBleed } from './chrome-bleed';
import './carousel.css';

export function ChromeBleedStrip() {
  useEffect(() => {
    syncVpChromeBleed();
    const onOrientationChange = () => syncVpChromeBleed();
    window.addEventListener('orientationchange', onOrientationChange);
    return () =>
      window.removeEventListener('orientationchange', onOrientationChange);
  }, []);

  return <div className="vp-chrome-bleed" aria-hidden="true" />;
}
