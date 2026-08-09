'use client';

/**
 * NavBar — primary navigation with desktop and mobile variants.
 *
 * Client component: dropdowns, hamburger, search, language switcher, and
 * contact modal trigger all require browser interactivity.
 *
 * Mobile: full-viewport overlay below the header row (clip-path wipe +
 * staggered item reveal). About dropdown children are flattened into
 * top-level links; desktop keeps NavDropdown hover behaviour unchanged.
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
import { NavDropdown } from './NavDropdown';
import { NavSearch } from './NavSearch';
import { useContactModal } from './ContactModalContext';
import type { Locale } from '@/i18n/routing';

type LinkHref = ComponentProps<typeof Link>['href'];

export interface NavItem {
  label: string;
  href?: LinkHref;
  dropdown?: { label: string; href: LinkHref }[];
  isContact?: boolean;
}

interface NavBarProps {
  locale: Locale;
  items: NavItem[];
  toggleAria: string;
  contactEmail?: string;
}

const MOBILE_LINK_CLASS =
  'vp-mobile-nav-link font-vp-heading text-[clamp(2.375rem,4.3vw,3.4375rem)] font-bold uppercase leading-[1] tracking-vp-heading text-white no-underline';

const CLOSE_MS = 180;

export function NavBar({ items, toggleAria, contactEmail }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const { openContact } = useContactModal();
  const togglerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const email = contactEmail?.trim();

  // Mount / reveal / exit wipe for the mobile overlay.
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

      // Reopen mid-close: panel DOM is reused, so snap clip-path back to
      // fully closed (with transitions off), force a paint, then run the
      // normal open sequence so the wipe always travels the full distance.
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

  /** Desktop (and shared non-flat) item renderer — unchanged path. */
  function renderItem(item: NavItem) {
    if (item.dropdown) {
      return (
        <NavDropdown
          key={item.label}
          label={item.label}
          href={item.href}
          items={item.dropdown}
          mobile={false}
        />
      );
    }

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

  function renderMobileFlat(): ReactNode[] {
    const nodes: ReactNode[] = [];
    let index = 0;

    for (const item of items) {
      if (item.dropdown) {
        for (const child of item.dropdown) {
          const i = index++;
          nodes.push(
            <li
              key={`${child.label}-${i}`}
              className="vp-mobile-nav-item nav-item"
              style={staggerStyle(i)}
            >
              <Link
                href={child.href}
                className={MOBILE_LINK_CLASS}
                onClick={closeMobile}
              >
                {child.label}
              </Link>
            </li>,
          );
        }
        continue;
      }

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

  const mobileItems = renderMobileFlat();
  const emailStaggerIndex = mobileItems.length;

  return (
    <>
      <div className="vp-mobile-lang-slot ml-auto mr-1 flex items-center md:hidden">
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

      {/* Desktop navigation */}
      <div className="hidden flex-grow items-center md:flex">
        <ul className="navbar-nav ms-auto flex list-none flex-row items-center p-0">
          {items.map((item) => renderItem(item))}
          <li className="nav-item">
            <LanguageSwitcher />
          </li>
        </ul>
        <NavSearch />
      </div>

      {/* Mobile full-screen overlay — nested under header z-50; below header row */}
      {panelMounted ? (
        <div
          ref={panelRef}
          className={`navbar-collapse vp-mobile-nav-panel md:hidden${
            panelVisible ? ' is-open' : ''
          }`}
          id="vp-navbar"
          aria-hidden={!panelVisible}
        >
          <div className="vp-mobile-nav-panel__inner">
            <ul className="vp-mobile-nav-list navbar-nav m-0 w-full list-none p-0">
              {mobileItems}
            </ul>
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
      ) : null}
    </>
  );
}
