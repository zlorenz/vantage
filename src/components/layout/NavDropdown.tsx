'use client';

/**
 * NavDropdown — About submenu with desktop hover and mobile accordion behaviour.
 *
 * Desktop (≥992px): opens on hover/focus-within with opacity + translateY transition.
 * Mobile (≤768px): tap toggles accordion with max-height animation.
 */

import { useState } from 'react';
import { Link } from '@/i18n/navigation';

interface NavDropdownProps {
  label: string;
  items: { label: string; href: string }[];
}

export function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <li
      className={`nav-item dropdown relative${open ? ' vp-dropdown-open show' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="nav-link dropdown-toggle block w-full bg-transparent px-4 py-[0.35rem] text-left uppercase md:inline-block md:w-auto"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      <ul
        className={`dropdown-menu absolute left-0 top-full z-50 min-w-[14rem] list-none border-0 bg-vp-dropdown-bg p-0 md:block${
          open ? ' show' : ''
        }`}
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="dropdown-item block px-4 py-2 text-sm uppercase tracking-vp-navbar text-white transition-colors duration-vp-fast hover:bg-vp-overlay-light"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
