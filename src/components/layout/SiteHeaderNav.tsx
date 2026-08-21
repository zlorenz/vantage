'use client';

/**
 * SiteHeaderNav — client wrapper for the fixed #header nav.
 *
 * Owns hide/show-on-scroll (translateY). The transparent gradient + blur
 * backdrop is pure CSS on #header::before — no scroll class for that —
 * so this only toggles visibility, leaving the backdrop untouched.
 *
 * Also publishes --vp-header-height from the real rendered header size so
 * the mobile full-screen nav can pad its content below the chrome, and so
 * siblings (e.g. /work PortfolioIndexCarousel) can read the same token via
 * :root — custom properties set only on #header do not inherit to them.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

const SCROLL_DELTA_PX = 10;

interface SiteHeaderNavProps {
  children: ReactNode;
  className: string;
  'aria-label': string;
}

export function SiteHeaderNav({
  children,
  className,
  'aria-label': ariaLabel,
}: SiteHeaderNavProps) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    function publishHeight() {
      if (!el) return;
      const value = `${el.offsetHeight}px`;
      el.style.setProperty('--vp-header-height', value);
      document.documentElement.style.setProperty('--vp-header-height', value);
    }

    publishHeight();
    const ro = new ResizeObserver(publishHeight);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--vp-header-height');
    };
  }, []);

  useEffect(() => {
    lastY.current = window.scrollY;

    function update() {
      ticking.current = false;
      const y = window.scrollY;

      // Always visible at (or above) the top — iOS rubber-band can go negative.
      if (y <= 0) {
        setHidden(false);
        lastY.current = 0;
        return;
      }

      // Keep visible while the mobile overlay menu is open.
      if (document.getElementById('vp-navbar')) {
        setHidden(false);
        lastY.current = y;
        return;
      }

      if (y > lastY.current + SCROLL_DELTA_PX) {
        setHidden(true);
        lastY.current = y;
      } else if (y < lastY.current - SCROLL_DELTA_PX) {
        setHidden(false);
        lastY.current = y;
      }
    }

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      ref={headerRef}
      id="header"
      className={`${className}${hidden ? ' vp-header--hidden' : ''}`}
      aria-label={ariaLabel}
      data-header-hidden={hidden ? 'true' : undefined}
    >
      {children}
    </nav>
  );
}
