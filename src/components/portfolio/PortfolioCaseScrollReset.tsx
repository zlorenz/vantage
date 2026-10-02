'use client';

/**
 * PortfolioCaseScrollReset - open the next case study or blog post at the top.
 *
 * Next.js keeps the window offset when both URLs share a dynamic route
 * (/portfolio/[slug] or /[slug]) and the clicked card is still on screen.
 * The loading state is shorter than the page, so the browser clamps that
 * offset, then scroll anchoring holds it while the next page streams in.
 * This turns anchoring off for the click and scrolls to the top when the
 * route changes. Back and Forward fire popstate; those keep the position
 * the browser restored.
 */

import {useEffect, useLayoutEffect} from 'react';
import {usePathname} from 'next/navigation';

/** A pathname change within this window is Back/Forward, not a carousel click. */
const POPSTATE_WINDOW_MS = 500;
/** Stop pinning after the case body has been still for this long. */
const SETTLE_MS = 180;
/** Give up if the next case never settles (failed navigation). */
const GIVE_UP_MS = 4000;

type ScrollResetState = {
  /** First case page in this document is a load or a cross-route entry. */
  initialized: boolean;
  /** Last pathname this reset has accounted for. */
  lastPathname: string | null;
  /**
   * True from a click navigation until the next page has settled at the top.
   * Strict mode replays the effect; the flag tells that replay to keep pinning.
   */
  pendingReset: boolean;
  /** performance.now() of the last Back/Forward, or 0 before any. */
  lastPopStateAt: number;
  /** The popstate listener is registered once per document, not once per module. */
  listening: boolean;
};

const SERVER_STATE: ScrollResetState = {
  initialized: false,
  lastPathname: null,
  pendingReset: false,
  lastPopStateAt: 0,
  listening: false,
};

/**
 * Kept on window so a remounted case page still knows the previous slug.
 * The client module can be evaluated again on navigation; module locals would
 * forget that this document already showed a case and skip the reset.
 */
function getState(): ScrollResetState {
  if (typeof window === 'undefined') return SERVER_STATE;
  const host = window as Window & {__vpCaseScroll?: ScrollResetState};
  if (!host.__vpCaseScroll) {
    host.__vpCaseScroll = {
      initialized: false,
      lastPathname: null,
      pendingReset: false,
      lastPopStateAt: 0,
      listening: false,
    };
  }
  return host.__vpCaseScroll;
}

if (typeof window !== 'undefined') {
  const state = getState();
  if (!state.listening) {
    state.listening = true;
    // Survives leaving the case page. Back remounts this component only after
    // popstate has already fired, so the listener cannot live in an effect.
    window.addEventListener('popstate', () => {
      getState().lastPopStateAt = performance.now();
    });
  }
}

function isHistoryTraversal(): boolean {
  return performance.now() - getState().lastPopStateAt < POPSTATE_WINDOW_MS;
}

/** Scroll anchoring would otherwise re-apply the carousel's old offset. */
function suppressScrollAnchoring(): void {
  document.documentElement.style.overflowAnchor = 'none';
}

function restoreScrollAnchoring(): void {
  document.documentElement.style.overflowAnchor = '';
}

/**
 * Blur the clicked card so the browser does not scroll that link back into
 * view, then zero html and body (either one can be the document scroller).
 */
function scrollCaseToTop(blurFocus: boolean): void {
  if (blurFocus) {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      active.blur();
    }
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function PortfolioCaseScrollReset() {
  // next-intl's usePathname returns the route template (/portfolio/[slug]),
  // which does not change between cases. The App Router pathname does.
  const pathname = usePathname();

  useEffect(() => {
    // Disable anchoring before Next swaps the case, not after the offset sticks.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isHistoryTraversal()) return;
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      // Case carousel, or the blog next-post carousel. Category pills inside
      // the blog carousel leave the post and must not pin this scroll reset.
      const inCaseNav = anchor.closest('.vp-project-nav');
      const inBlogNav =
        anchor.closest('.vp-blog-nav') && !anchor.closest('.vp-blog-nav__pill');
      if (!inCaseNav && !inBlogNav) return;
      suppressScrollAnchoring();
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useLayoutEffect(() => {
    const state = getState();
    // Hydration, or the first client entry onto a case. Next already scrolls
    // when the route shape changes; do not jump a restored reload.
    if (!state.initialized) {
      state.initialized = true;
      state.lastPathname = pathname;
      return;
    }

    if (isHistoryTraversal()) {
      state.lastPathname = pathname;
      state.pendingReset = false;
      restoreScrollAnchoring();
      return;
    }

    if (state.lastPathname !== pathname) {
      state.lastPathname = pathname;
      state.pendingReset = true;
      suppressScrollAnchoring();
      scrollCaseToTop(true);
    }
  }, [pathname]);

  useEffect(() => {
    const state = getState();
    if (!state.pendingReset) return;

    const root = document.documentElement;
    const caseBody = document.getElementById('main') ?? root;
    suppressScrollAnchoring();
    scrollCaseToTop(true);

    let stopped = false;
    let settleTimer = 0;
    let giveUpTimer = 0;

    const stop = () => {
      if (stopped) return;
      stopped = true;
      getState().pendingReset = false;
      window.clearTimeout(settleTimer);
      window.clearTimeout(giveUpTimer);
      observer.disconnect();
      restoreScrollAnchoring();
    };

    // Late RSC chunks grow #main and would drag the old offset back down.
    const armSettle = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (stopped) return;
        if (window.scrollY !== 0) {
          scrollCaseToTop(false);
          armSettle();
          return;
        }
        stop();
      }, SETTLE_MS);
    };

    const observer = new ResizeObserver(() => {
      if (stopped) return;
      if (window.scrollY !== 0) scrollCaseToTop(false);
      armSettle();
    });
    observer.observe(caseBody);
    armSettle();

    giveUpTimer = window.setTimeout(stop, GIVE_UP_MS);

    return () => {
      stopped = true;
      window.clearTimeout(settleTimer);
      window.clearTimeout(giveUpTimer);
      observer.disconnect();
      // Unmount (leaving the case) must not leave anchoring disabled.
      // A strict-mode replay turns it back off while pendingReset is set.
      if (!getState().pendingReset) restoreScrollAnchoring();
    };
  }, [pathname]);

  return null;
}
