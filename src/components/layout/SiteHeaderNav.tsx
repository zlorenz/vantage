'use client';

/**
 * SiteHeaderNav — client wrapper for the fixed #header nav.
 *
 * Owns hide/show-on-scroll (translateY). Navbar is transparent on home and
 * /work (full-bleed imagery). On /about it stays transparent over the hero
 * loupe, then turns solid once `.vp-about-statement__stage` reaches the bar.
 * Everywhere else the bar is solid black so chrome does not collide with
 * page text under the fixed header.
 *
 * Also publishes --vp-header-height from the real rendered header size so
 * the mobile full-screen nav can pad its content below the chrome, and so
 * siblings (e.g. /work PortfolioIndexCarousel) can read the same token via
 * :root — custom properties set only on #header do not inherit to them.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';

const SCROLL_DELTA_PX = 10;

/** Full-bleed image pages — keep the bar transparent over the hero. */
const ALWAYS_TRANSPARENT_PATHS = new Set(['/', '/work']);

/**
 * Hero stays transparent until the statement stage reaches the nav bottom.
 * Selector matches AboutStatementAnimated's stage wrapper.
 */
const ABOUT_SOLID_AFTER_SELECTOR = '.vp-about-statement__stage';

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
  const pathname = usePathname();
  const isAbout = pathname === '/about';
  const alwaysTransparent = ALWAYS_TRANSPARENT_PATHS.has(pathname);
  // About starts clear over the hero; flips solid once past that section.
  const [aboutPastHero, setAboutPastHero] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);
  const aboutTicking = useRef(false);
  const headerRef = useRef<HTMLElement>(null);

  const solidHeader =
    !alwaysTransparent && (!isAbout || aboutPastHero);

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

  // /about — solid when the statement stage's top reaches the nav bottom.
  useEffect(() => {
    if (!isAbout) {
      setAboutPastHero(false);
      return;
    }

    function measure() {
      aboutTicking.current = false;
      const header = headerRef.current;
      const stage = document.querySelector(ABOUT_SOLID_AFTER_SELECTOR);
      if (!header || !(stage instanceof HTMLElement)) {
        setAboutPastHero(false);
        return;
      }
      const headerBottom = header.getBoundingClientRect().bottom;
      setAboutPastHero(stage.getBoundingClientRect().top <= headerBottom);
    }

    function onScrollOrResize() {
      if (aboutTicking.current) return;
      aboutTicking.current = true;
      requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener('scroll', onScrollOrResize, {passive: true});
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isAbout]);

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

      // Keep visible while a nav overlay/dropdown is open.
      if (
        document.getElementById('vp-navbar') ||
        document.getElementById('vp-desktop-navbar')
      ) {
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
      className={`${className}${solidHeader ? ' vp-header--solid' : ''}${
        hidden ? ' vp-header--hidden' : ''
      }`}
      aria-label={ariaLabel}
      data-header-hidden={hidden ? 'true' : undefined}
      data-header-solid={solidHeader ? 'true' : undefined}
    >
      {children}
    </nav>
  );
}
