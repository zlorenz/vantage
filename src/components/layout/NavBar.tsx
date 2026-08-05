'use client';

/**
 * NavBar — primary navigation with desktop and mobile variants.
 *
 * Client component: dropdowns, hamburger, search, language switcher, and
 * contact modal trigger all require browser interactivity.
 */

import { useEffect, useRef, useState, type ComponentProps } from 'react';
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
}

export function NavBar({ locale, items, toggleAria }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openContact } = useContactModal();
  const togglerRef = useRef<HTMLButtonElement>(null);

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
      setMobileOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  function renderItem(item: NavItem, mobile = false) {
    if (item.dropdown) {
      return (
        <NavDropdown
          key={item.label}
          label={item.label}
          href={item.href}
          items={item.dropdown}
          mobile={mobile}
          onNavigate={mobile ? closeMobile : undefined}
        />
      );
    }

    if (item.isContact) {
      return (
        <li key={item.label} className="nav-item">
          <button
            type="button"
            className={`nav-link cursor-pointer border-0 bg-transparent uppercase ${
              mobile ? 'w-full text-left' : 'block px-4 py-[0.35rem]'
            }`}
            onClick={() => {
              openContact();
              closeMobile();
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
          className={`nav-link cursor-pointer uppercase ${
            mobile ? '' : 'block px-4 py-[0.35rem]'
          }`}
          onClick={closeMobile}
        >
          {item.label}
        </Link>
      </li>
    );
  }

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

      {/* Mobile panel */}
      {mobileOpen ? (
        <div
          className="navbar-collapse absolute left-0 right-0 top-full z-40 block w-full bg-black/84 px-6 py-5 md:hidden"
          id="vp-navbar"
        >
          <ul className="navbar-nav m-0 w-full list-none p-0">
            {items.map((item) => renderItem(item, true))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
