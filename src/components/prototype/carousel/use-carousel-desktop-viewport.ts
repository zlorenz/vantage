'use client';

import {useSyncExternalStore} from 'react';
import {CAROUSEL_COVER_MATH_MQ} from './detect-pillarbox-aspect';

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(CAROUSEL_COVER_MATH_MQ);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

/**
 * True at ≥768px — matches carousel cover-math and desktop overlay breakpoint.
 * SSR assumes desktop so inactive neighbors hydrate with preload="auto" (desktop path).
 */
export function useCarouselDesktopViewport(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(CAROUSEL_COVER_MATH_MQ).matches,
    () => true,
  );
}
