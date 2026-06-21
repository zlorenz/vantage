'use client';

/**
 * NavBar — primary navigation with desktop and mobile variants.
 *
 * Client component: dropdowns, hamburger, search, language switcher, and
 * contact modal trigger all require browser interactivity.
 */

import { useState, type ComponentProps } from 'react';
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
}

export function NavBar({ locale, items }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openContact } = useContactModal();

  function renderItem(item: NavItem, mobile = false) {
    if (item.dropdown) {
      return <NavDropdown key={item.label} label={item.label} items={item.dropdown} />;
    }

    if (item.isContact) {
      return (
        <li key={item.label} className={`nav-item${mobile ? ' mb-1' : ''}`}>
          <button
            type="button"
            className={`nav-link block border-0 bg-transparent uppercase ${
              mobile
                ? 'w-full rounded-vp-nav-pill px-3 py-2 text-left hover:bg-white/8'
                : 'px-4 py-[0.35rem]'
            }`}
            onClick={() => {
              openContact();
              setMobileOpen(false);
            }}
          >
            {item.label}
          </button>
        </li>
      );
    }

    return (
      <li key={item.label} className={`nav-item${mobile ? ' mb-1' : ''}`}>
        <Link
          href={item.href!}
          className={`nav-link block uppercase ${
            mobile
              ? 'rounded-vp-nav-pill px-3 py-2 hover:bg-white/8'
              : 'px-4 py-[0.35rem]'
          }`}
          onClick={() => setMobileOpen(false)}
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
        type="button"
        className="navbar-toggler border-0 bg-transparent p-2 shadow-none md:hidden"
        aria-expanded={mobileOpen}
        aria-controls="vp-navbar"
        aria-label="Toggle navigation"
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
        <NavSearch locale={locale} />
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
