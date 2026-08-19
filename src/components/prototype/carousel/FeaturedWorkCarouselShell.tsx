'use client';

/**
 * Selects the carousel build for the pointer type.
 *
 * Coarse pointers get the Embla build, whose transform-driven paging cannot hit
 * the WebKit scrollTop/touch-swallow bug. Fine pointers keep the native
 * scroll-snap build with its wheel and keyboard paging, unchanged.
 *
 * The server snapshot is always false, so the server and the hydration render
 * both emit the native build — the same markup as before this split — and
 * coarse pointers swap on the first post-hydration pass. That transient mount
 * never reaches a <video>: CarouselVimeo renders null until its preview mint
 * resolves and aborts that request on unmount, so the swap costs one cancelled
 * fetch and leaves the player activation path untouched.
 */

import {useSyncExternalStore} from 'react';
import {FeaturedWorkCarousel} from './FeaturedWorkCarousel';
import {FeaturedWorkCarouselTouch} from './FeaturedWorkCarouselTouch';
import type {PrototypeCarouselSlide} from './types';

const COARSE_POINTER_QUERY = '(pointer: coarse)';

/** Lazily memoized: getSnapshot runs on every render, matchMedia need not. */
let coarsePointerMedia: MediaQueryList | null = null;

function coarsePointerQuery(): MediaQueryList {
  coarsePointerMedia ??= window.matchMedia(COARSE_POINTER_QUERY);
  return coarsePointerMedia;
}

function subscribeCoarsePointer(onStoreChange: () => void): () => void {
  const query = coarsePointerQuery();
  query.addEventListener('change', onStoreChange);
  return () => query.removeEventListener('change', onStoreChange);
}

function getCoarsePointerSnapshot(): boolean {
  return coarsePointerQuery().matches;
}

function getCoarsePointerServerSnapshot(): boolean {
  return false;
}

interface FeaturedWorkCarouselShellProps {
  slides: PrototypeCarouselSlide[];
}

export function FeaturedWorkCarouselShell({slides}: FeaturedWorkCarouselShellProps) {
  const coarsePointer = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    getCoarsePointerServerSnapshot,
  );

  if (coarsePointer) {
    return <FeaturedWorkCarouselTouch slides={slides} />;
  }

  return <FeaturedWorkCarousel slides={slides} />;
}
