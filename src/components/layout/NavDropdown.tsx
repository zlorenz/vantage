'use client';

/**
 * NavDropdown — submenu with desktop hover and mobile accordion behaviour.
 *
 * Desktop (hover-capable layout): mouse enter/leave reveals children.
 * Mobile overlay: click/tap only — hover handlers are not attached, so
 * resized desktop browsers and iOS sticky-hover don't auto-expand.
 */

import { useState, type ComponentProps, type MouseEvent } from 'react';
import { Link } from '@/i18n/navigation';

type LinkHref = ComponentProps<typeof Link>['href'];

interface NavDropdownProps {
  label: string;
  /** When set, the parent label navigates here (desktop click / mobile when open). */
  href?: LinkHref;
  items: { label: string; href: LinkHref }[];
  /** Mobile overlay variant — caret is absolutely positioned via CSS. */
  mobile?: boolean;
  /** Called when a submenu link is activated (e.g. close mobile panel). */
  onNavigate?: () => void;
}

function isMobileNav(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 991px)').matches
  );
}

export function NavDropdown({
  label,
  href,
  items,
  mobile = false,
  onNavigate,
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);

  function onParentClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!isMobileNav()) return;
    // First tap expands; next tap follows the link.
    if (!open) {
      e.preventDefault();
      setOpen(true);
    }
  }

  const parentClassName = mobile
    ? 'nav-link dropdown-toggle w-full cursor-pointer bg-transparent text-left uppercase'
    : 'nav-link dropdown-toggle inline-flex w-full cursor-pointer items-center gap-1 bg-transparent px-4 py-[0.35rem] text-left uppercase md:w-auto';

  const caret = <span className="vp-nav-caret" aria-hidden="true" />;

  // Hover-to-open is desktop-only. On the mobile overlay (and any
  // touch-first context using mobile=true), click/tap toggles instead —
  // otherwise mouseenter fires in responsive-mode desktop browsers and
  // sticky :hover consumes the first tap on iOS.
  const hoverHandlers = mobile
    ? undefined
    : {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
      };

  return (
    <li
      className={`nav-item dropdown relative${open ? ' vp-dropdown-open show' : ''}`}
      {...hoverHandlers}
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
              className="dropdown-item block cursor-pointer whitespace-nowrap uppercase tracking-vp-navbar text-white transition-colors duration-vp-fast"
              onClick={() => onNavigate?.()}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
