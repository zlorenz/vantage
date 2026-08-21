'use client';

/**
 * NavBar — primary navigation with desktop and mobile variants.
 *
 * Client component: hamburger, search, language switcher, and contact modal
 * trigger all require browser interactivity.
 *
 * Mobile: full-viewport black panel slides in via translateY behind the
 * always-translucent header, with staggered item reveal.
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

/** Compact primary pill — matches desktop nav link type size/weight. */
const DESKTOP_BRIEF_CLASS =
  'mr-4 inline-flex items-center rounded-full border-0 bg-vp-btn-primary-bg px-4 py-[0.35rem] font-vp-heading text-[0.875rem] font-normal uppercase tracking-[var(--vp-navbar-link-spacing)] text-vp-btn-primary-text no-underline transition-colors duration-vp-default hover:bg-vp-btn-primary-hover-bg';

const MOBILE_BRIEF_CLASS =
  'inline-flex items-center rounded-full border-0 bg-vp-btn-primary-bg px-8 py-3 font-vp-heading text-sm font-semibold uppercase tracking-vp-btn text-vp-btn-primary-text no-underline transition-colors duration-vp-default hover:bg-vp-btn-primary-hover-bg';

const CLOSE_MS = 180;

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
  const { openContact } = useContactModal();
  const togglerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const email = contactEmail?.trim();

  // Mount / reveal / exit slide for the mobile overlay.
  useEffect(() => {
    // Detect reopen-while-closing before clearing the timer — cold opens
    // never have a pending close timer.
    const interruptingClose = !!closeTimerRef.current;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (mobileOpen) {
      setPanelMounted(true);
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setPanelVisible(true);
        return;
      }

      // Reopen mid-close: panel DOM is reused, so snap transform back to
      // fully closed (with transitions off), force a paint, then run the
      // normal open sequence so the slide always travels the full distance.
      if (interruptingClose) {
        const el = panelRef.current;
        if (el) {
          el.classList.add('is-resetting');
          // Flush styles so the closed frame is committed before we animate.
          void el.offsetHeight;
          el.classList.remove('is-resetting');
        }
      }

      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPanelVisible(true));
      });
      return () => cancelAnimationFrame(id);
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

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Lock body scroll while the full-screen overlay is mounted.
  useEffect(() => {
    if (!panelMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panelMounted]);

  // Close mobile panel on outside tap/click (page content). Exclude the
  // panel itself and the hamburger so the toggler can still open/close.
  useEffect(() => {
    if (!mobileOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      const panel = document.getElementById('vp-navbar');
      if (panel?.contains(target)) return;
      if (togglerRef.current?.contains(target)) return;
      // Header chrome (logo, language switcher) stays interactive; don't
      // treat those as "outside" dismissals.
      const header = document.getElementById('header');
      if (header?.contains(target)) return;
      setMobileOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  function renderItem(item: NavItem) {
    if (item.isContact) {
      return (
        <li key={item.label} className="nav-item">
          <button
            type="button"
            className="nav-link block cursor-pointer border-0 bg-transparent px-4 py-[0.35rem] uppercase"
            onClick={() => {
              openContact();
            }}
          >
            {item.label}
          </button>
        </li>
      );
    }

    return (
      <li key={item.label} className="nav-item">
        <Link
          href={item.href!}
          className="nav-link block cursor-pointer px-4 py-[0.35rem] uppercase"
        >
          {item.label}
        </Link>
      </li>
    );
  }

  function staggerStyle(index: number): CSSProperties {
    return { '--vp-nav-stagger': index } as CSSProperties;
  }

  function renderMobileItems(): ReactNode[] {
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
              className={`${MOBILE_LINK_CLASS} w-full cursor-pointer border-0 bg-transparent p-0 text-left`}
              onClick={() => {
                openContact();
                closeMobile();
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
            className={MOBILE_LINK_CLASS}
            onClick={closeMobile}
          >
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
        <LanguageSwitcher />
      </div>

      {/* Desktop navigation — links + brief; lang/search sit outside as siblings */}
      <div className="hidden flex-grow items-center md:flex">
        <ul className="navbar-nav ms-auto flex list-none flex-row items-center p-0">
          {items.map((item) => renderItem(item))}
          <li className="nav-item">
            <Link href={briefHref} className={DESKTOP_BRIEF_CLASS}>
              {briefLabel}
            </Link>
          </li>
        </ul>
      </div>

      {/* Desktop language switcher — sibling before hamburger (mirrors mobile slot) */}
      <div className="vp-desktop-lang-slot mr-1 hidden items-center md:flex">
        <LanguageSwitcher />
      </div>

      <button
        ref={togglerRef}
        type="button"
        className="navbar-toggler border-0 bg-transparent p-2 shadow-none md:hidden"
        aria-expanded={mobileOpen}
        aria-controls="vp-navbar"
        aria-label={toggleAria}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span className="navbar-toggler-icon relative block h-5 w-7" />
      </button>

      <NavSearch />

      {/* Mobile full-viewport panel — slides behind header chrome (z-50) */}
      {panelMounted ? (
        <div
          ref={panelRef}
          className={`vp-mobile-nav-panel md:hidden${
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
                onClick={closeMobile}
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
