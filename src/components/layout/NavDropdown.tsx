'use client';

/**
 * NavDropdown — submenu with desktop hover and mobile accordion behaviour.
 *
 * Desktop: hover reveals children; a parent without `href` (e.g. About) is a
 * pure toggle. Mobile: tap toggles the submenu (or, with `href`, first tap
 * expands and the second follows the link).
 */

import { useState, type ComponentProps, type MouseEvent } from 'react';
import { Link } from '@/i18n/navigation';

type LinkHref = ComponentProps<typeof Link>['href'];

interface NavDropdownProps {
  label: string;
  /** When set, the parent label navigates here (desktop click / mobile when open). */
  href?: LinkHref;
  items: { label: string; href: LinkHref }[];
}

function isMobileNav(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches
  );
}

export function NavDropdown({ label, href, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);

  function onParentClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!isMobileNav()) return;
    // First tap expands; next tap follows the link.
    if (!open) {
      e.preventDefault();
      setOpen(true);
    }
  }

  const parentClassName =
    'nav-link dropdown-toggle inline-flex w-full cursor-pointer items-center gap-1 bg-transparent px-4 py-[0.35rem] text-left uppercase md:w-auto';

  const caret = (
    <span className="vp-nav-caret" aria-hidden="true" />
  );

  return (
    <li
      className={`nav-item dropdown relative${open ? ' vp-dropdown-open show' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {href ? (
        <Link
          href={href}
          className={parentClassName}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={onParentClick}
        >
          {label}
          {caret}
        </Link>
      ) : (
        <button
          type="button"
          className={`${parentClassName} border-0`}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          {label}
          {caret}
        </button>
      )}
      <ul
        className={`dropdown-menu absolute left-0 top-full z-50 min-w-[17rem] list-none border-0 bg-vp-dropdown-bg p-0 md:block${
          open ? ' show' : ''
        }`}
      >
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="dropdown-item block whitespace-nowrap px-4 py-2 text-sm uppercase tracking-vp-navbar text-white transition-colors duration-vp-fast hover:bg-vp-overlay-light"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
