'use client';

/**
 * Location marquee — thin ambient strip below the Production Services image band.
 */

import { useEffect, useState } from 'react';

const MARQUEE_SEGMENT = 'SAIGON · HANOI · BALI · SINGAPORE · AND BEYOND · ';

export function AboutProductionServicesMarquee() {
  const [isStatic, setIsStatic] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setIsStatic(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const marqueeClass = [
    'vp-about-production-services__marquee',
    isStatic ? 'vp-about-production-services__marquee--static' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={marqueeClass}>
      <span className="sr-only">SAIGON · HANOI · BALI · SINGAPORE · AND BEYOND</span>
      <div className="vp-about-production-services__marquee-track" aria-hidden="true">
        <span className="vp-about-production-services__marquee-segment">{MARQUEE_SEGMENT}</span>
        <span className="vp-about-production-services__marquee-segment">{MARQUEE_SEGMENT}</span>
      </div>
    </div>
  );
}
