'use client';

/**
 * NavBar — primary navigation with desktop and mobile variants.
 *
 * Client component: hamburger, search, language switcher, and contact modal
 * trigger all require browser interactivity.
 *
 * Mobile: full-viewport black panel slides in via translateY behind the
 * always-translucent header, with staggered item reveal.
 *
 * Desktop: anchored dropdown below the hamburger (same open/close state
 * machine — mobileOpen / panelMounted / panelVisible + CLOSE_MS).
 */

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavSearch } from './NavSearch';
import { useContactModal } from './ContactModalContext';
import type { Locale } from '@/i18n/routing';

type LinkHref = ComponentProps<typeof Link>['href'];

export interface NavItem {
  label: string;
  href?: LinkHref;
  isContact?: boolean;
}

interface NavBarProps {
  locale: Locale;
  items: NavItem[];
  toggleAria: string;
  contactEmail?: string;
  briefLabel: string;
  briefHref: LinkHref;
}

const MOBILE_LINK_CLASS =
  'vp-mobile-nav-link font-vp-heading text-[clamp(2.375rem,4.3vw,3.4375rem)] font-bold uppercase leading-[1] tracking-vp-heading text-white no-underline';

const DESKTOP_LINK_CLASS =
  'vp-desktop-nav-link font-vp-heading text-[0.875rem] font-normal uppercase tracking-[var(--vp-navbar-link-spacing)] text-white no-underline';

const MOBILE_BRIEF_CLASS =
  'inline-flex items-center rounded-full border-0 bg-vp-btn-primary-bg px-8 py-3 font-vp-heading text-sm font-semibold uppercase tracking-vp-btn text-vp-btn-primary-text no-underline transition-colors duration-vp-default hover:bg-vp-btn-primary-hover-bg';

const CLOSE_MS = 180;

const MOBILE_MQ = '(max-width: 991.98px)';

export function NavBar({
  items,
  toggleAria,
  contactEmail,
  briefLabel,
  briefHref,
}: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const { openContact } = useContactModal();
  const togglerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reopenSnapRef = useRef(false);
  const email = contactEmail?.trim();

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
  // setTimeout — not rAF — so reveal still runs if the tab is backgrounded
  // (rAF can be throttled indefinitely in automation / background tabs).
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

  // Lock body scroll only for the mobile full-screen overlay — desktop
  // dropdown must leave page content scrollable/interactive.
  useEffect(() => {
    if (!panelMounted || !isMobileViewport) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panelMounted, isMobileViewport]);

  // Close on outside tap/click. Exclude the active panel and hamburger.
  // Mobile keeps header chrome interactive (logo / lang); desktop closes on
  // any click outside the dropdown itself.
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
      }

      setMobileOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [mobileOpen, isMobileViewport]);

  function closeMenu() {
    setMobileOpen(false);
  }

  function staggerStyle(index: number): CSSProperties {
    return { '--vp-nav-stagger': index } as CSSProperties;
  }

  function renderPanelItems(linkClass: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    let index = 0;

    for (const item of items) {
      if (item.isContact) {
        const i = index++;
        nodes.push(
          <li
            key={item.label}
            className="vp-mobile-nav-item nav-item"
            style={staggerStyle(i)}
          >
            <button
              type="button"
              className={`${linkClass} w-full cursor-pointer border-0 bg-transparent p-0 text-left`}
              onClick={() => {
                openContact();
                closeMenu();
              }}
            >
              {item.label}
            </button>
          </li>,
        );
        continue;
      }

      const i = index++;
      nodes.push(
        <li
          key={item.label}
          className="vp-mobile-nav-item nav-item"
          style={staggerStyle(i)}
        >
          <Link
            href={item.href!}
            className={linkClass}
            onClick={closeMenu}
          >
            {item.label}
          </Link>
        </li>,
      );
    }

    return nodes;
  }

  const mobileItems = renderPanelItems(MOBILE_LINK_CLASS);
  const desktopItems = renderPanelItems(DESKTOP_LINK_CLASS);
  const briefStaggerIndex = mobileItems.length;
  const emailStaggerIndex = briefStaggerIndex + 1;

  return (
    <>
      <div className="vp-mobile-lang-slot ml-auto mr-1 flex items-center md:hidden">
        <LanguageSwitcher />
      </div>

      {/* Desktop language switcher — sibling before hamburger (mirrors mobile slot) */}
      <div className="vp-desktop-lang-slot ml-auto mr-1 hidden items-center md:flex">
        <LanguageSwitcher />
      </div>

      <div className="relative z-50">
        <button
          ref={togglerRef}
          type="button"
          className="navbar-toggler border-0 bg-transparent p-2 shadow-none"
          aria-expanded={mobileOpen}
          aria-controls={isMobileViewport ? 'vp-navbar' : 'vp-desktop-navbar'}
          aria-label={toggleAria}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="navbar-toggler-icon relative block h-5 w-7" />
        </button>

        {/* Desktop anchored dropdown — below hamburger, right-aligned, no scrim */}
        {panelMounted && !isMobileViewport ? (
          <div
            className={`vp-nav-panel vp-desktop-nav-panel${
              panelVisible ? ' is-open' : ''
            }`}
            id="vp-desktop-navbar"
            aria-hidden={!panelVisible}
          >
            <ul className="vp-desktop-nav-list m-0 list-none p-0">
              {desktopItems}
            </ul>
          </div>
        ) : null}
      </div>

      <NavSearch />

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
                  className="vp-mobile-nav-email vp-mobile-nav-item text-xl font-bold text-vp-link no-underline hover:text-vp-link-hover"
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
