'use client';

/**
 * NavBar — primary navigation with desktop and mobile variants.
 *
 * Client component: hamburger, search, language switcher require browser
 * interactivity.
 *
 * Mobile: full-viewport black panel slides in via translateY behind the
 * always-translucent header, with staggered item reveal.
 *
 * Desktop: Figma 90:39846 right-rail panel (541×636) under the header —
 * numbered links, social cells, Send a Brief CTA + page scrim. Same
 * open/close state machine (mobileOpen / panelMounted / panelVisible +
 * CLOSE_MS).
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import type {SiteSettings} from '@/types/sanity';
import {LanguageSwitcher} from './LanguageSwitcher';
import {NavSearch} from './NavSearch';
import {
  NAV_MENU_SOCIAL_ORDER,
  resolveSiteSocials,
  SocialGlyph,
} from './SiteFooter';

type LinkHref = ComponentProps<typeof Link>['href'];

export interface NavItem {
  label: string;
  href: LinkHref;
}

interface NavBarProps {
  locale: Locale;
  items: NavItem[];
  toggleAria: string;
  contactEmail?: string;
  briefLabel: string;
  briefHref: LinkHref;
  siteSettings: SiteSettings;
  /** Accessible label for the desktop page-dimming scrim. */
  closeMenuAria: string;
}

const MOBILE_LINK_CLASS =
  'vp-mobile-nav-link font-vp-heading text-[clamp(2.375rem,4.3vw,3.4375rem)] font-bold uppercase leading-[1] tracking-vp-heading text-white no-underline';

const MOBILE_BRIEF_CLASS =
  'inline-flex items-center rounded-full border-0 bg-vp-btn-primary-bg px-8 py-3 font-vp-heading text-sm font-semibold uppercase tracking-vp-btn text-vp-btn-primary-text no-underline transition-colors duration-vp-default hover:bg-vp-btn-primary-hover-bg';

const CLOSE_MS = 180;

/** Keep 992 split — Figma rail is desktop-only; mobile keeps full-viewport panel. */
const MOBILE_MQ = '(max-width: 991.98px)';

function BriefArrowIcon() {
  return (
    <svg
      className="vp-desktop-nav-brief__arrow"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M4.2 12.9 11.4 5.7H6.75V4.2H14.1v7.35h-1.5V6.9L5.4 14.1z"
      />
    </svg>
  );
}

export function NavBar({
  items,
  toggleAria,
  contactEmail,
  briefLabel,
  briefHref,
  siteSettings,
  closeMenuAria,
}: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const togglerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reopenSnapRef = useRef(false);
  const email = contactEmail?.trim();

  const navSocials = useMemo(
    () => resolveSiteSocials(siteSettings, NAV_MENU_SOCIAL_ORDER),
    [siteSettings],
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    function sync() {
      setIsMobileViewport(mq.matches);
    }
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Mount / unmount panels — shared mobileOpen state for both breakpoints.
  useEffect(() => {
    const interruptingClose = !!closeTimerRef.current;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (mobileOpen) {
      if (interruptingClose) reopenSnapRef.current = true;
      setPanelMounted(true);
      return;
    }

    if (!panelMounted) return;

    setPanelVisible(false);
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setPanelMounted(false);
      return;
    }
    closeTimerRef.current = setTimeout(() => {
      setPanelMounted(false);
      closeTimerRef.current = null;
    }, CLOSE_MS);
  }, [mobileOpen, panelMounted]);

  // Reveal after mount paint (0.28s open transition applied via .is-open CSS).
  useEffect(() => {
    if (!mobileOpen || !panelMounted) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setPanelVisible(true);
      return;
    }

    if (reopenSnapRef.current) {
      reopenSnapRef.current = false;
      document
        .querySelectorAll<HTMLElement>('#header .vp-nav-panel')
        .forEach((el) => {
          el.classList.add('is-resetting');
          void el.offsetHeight;
          el.classList.remove('is-resetting');
        });
    }

    const t = window.setTimeout(() => setPanelVisible(true), 0);
    return () => window.clearTimeout(t);
  }, [mobileOpen, panelMounted]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Lock body scroll for mobile overlay and desktop rail+scrim takeover.
  useEffect(() => {
    if (!panelMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panelMounted]);

  // Close on outside tap/click. Exclude the active panel and hamburger.
  // Mobile keeps header chrome interactive (logo / lang); desktop closes on
  // outside click (scrim or page) but header cells stay usable.
  useEffect(() => {
    if (!mobileOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (togglerRef.current?.contains(target)) return;
      const mobilePanel = document.getElementById('vp-navbar');
      if (mobilePanel?.contains(target)) return;
      const desktopPanel = document.getElementById('vp-desktop-navbar');
      if (desktopPanel?.contains(target)) return;

      if (isMobileViewport) {
        const header = document.getElementById('header');
        if (header?.contains(target)) return;
      } else {
        // Desktop: keep EN/CN + logo interactive without forcing close first.
        const header = document.getElementById('header');
        if (header?.contains(target)) return;
      }

      setMobileOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [mobileOpen, isMobileViewport]);

  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  function closeMenu() {
    setMobileOpen(false);
  }

  function staggerStyle(index: number): CSSProperties {
    return {'--vp-nav-stagger': index} as CSSProperties;
  }

  function renderMobileItems(): ReactNode[] {
    const nodes: ReactNode[] = [];
    let index = 0;

    for (const item of items) {
      const i = index++;
      nodes.push(
        <li
          key={item.label}
          className="vp-mobile-nav-item nav-item"
          style={staggerStyle(i)}
        >
          <Link href={item.href} className={MOBILE_LINK_CLASS} onClick={closeMenu}>
            {item.label}
          </Link>
        </li>,
      );
    }

    return nodes;
  }

  const mobileItems = renderMobileItems();
  const briefStaggerIndex = mobileItems.length;
  const emailStaggerIndex = briefStaggerIndex + 1;

  return (
    <>
      <div className="vp-mobile-lang-slot ml-auto mr-1 flex items-center md:hidden">
        <LanguageSwitcher variant="toggle" />
      </div>

      {/* Desktop: EN + 中文 cells (Figma nav chrome) — sibling before hamburger */}
      <div className="vp-desktop-lang-slot ml-auto hidden md:flex">
        <LanguageSwitcher variant="cells" />
      </div>

      <div className="vp-nav-toggler-cell relative z-50 flex">
        <button
          ref={togglerRef}
          type="button"
          className="navbar-toggler border-0 bg-transparent p-[0.4375rem] shadow-none md:p-0"
          aria-expanded={mobileOpen}
          aria-controls={isMobileViewport ? 'vp-navbar' : 'vp-desktop-navbar'}
          aria-label={toggleAria}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="navbar-toggler-icon relative block h-5 w-7" />
        </button>
      </div>

      {/* Desktop page scrim — z-45 under header (z-50); click closes. */}
      {panelMounted && !isMobileViewport ? (
        <button
          type="button"
          className={`vp-desktop-nav-scrim${panelVisible ? ' is-open' : ''}`}
          aria-label={closeMenuAria}
          tabIndex={-1}
          onClick={closeMenu}
        />
      ) : null}

      {/* Desktop right-rail panel (Figma 90:39846) — fixed under header, right:0 */}
      {panelMounted && !isMobileViewport ? (
        <div
          className={`vp-nav-panel vp-desktop-nav-panel${
            panelVisible ? ' is-open' : ''
          }`}
          id="vp-desktop-navbar"
          role="navigation"
          aria-label={toggleAria}
          aria-hidden={!panelVisible}
        >
          <ul className="vp-desktop-nav-list m-0 list-none p-0">
            {items.map((item, index) => (
              <li key={item.label} className="vp-desktop-nav-item nav-item">
                <Link
                  href={item.href}
                  className="vp-desktop-nav-link"
                  onClick={closeMenu}
                >
                  <span className="vp-desktop-nav-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <span className="vp-desktop-nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {navSocials.length ? (
            <ul className="vp-desktop-nav-socials m-0 list-none p-0">
              {navSocials.map((s) => (
                <li key={s.key} className="vp-desktop-nav-social">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    aria-label={s.label}
                    className="vp-desktop-nav-social__link"
                  >
                    <SocialGlyph
                      icon={s.icon}
                      className="vp-desktop-nav-social__icon"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <Link
            href={briefHref}
            className="vp-desktop-nav-brief"
            onClick={closeMenu}
          >
            <span className="vp-desktop-nav-brief__label">{briefLabel}</span>
            <BriefArrowIcon />
          </Link>
        </div>
      ) : null}

      {/* Mobile full-viewport panel — slides behind header chrome (z-50) */}
      {panelMounted && isMobileViewport ? (
        <div
          className={`vp-nav-panel vp-mobile-nav-panel${
            panelVisible ? ' is-open' : ''
          }`}
          id="vp-navbar"
          aria-hidden={!panelVisible}
        >
          <div className="vp-mobile-nav-panel__inner">
            <NavSearch alwaysExpanded />
            <ul className="vp-mobile-nav-list navbar-nav m-0 w-full list-none p-0">
              {mobileItems}
            </ul>
            <div className="vp-mobile-nav-footer">
              <Link
                href={briefHref}
                className={`${MOBILE_BRIEF_CLASS} vp-mobile-nav-item`}
                style={staggerStyle(briefStaggerIndex)}
                onClick={closeMenu}
              >
                {briefLabel}
              </Link>
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="vp-mobile-nav-email vp-mobile-nav-item text-xl font-bold text-vp-link no-underline transition-colors duration-vp-default hover:text-vp-link-hover"
                  style={staggerStyle(emailStaggerIndex)}
                >
                  {email}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
