/**
 * SiteHeader — fixed top navigation bar (server component).
 *
 * Receives siteSettings and navPages from the locale layout (single fetch).
 * Logo is a static brand asset in /public/brand/. Interactive nav is
 * delegated to the NavBar client component.
 */

import Image from 'next/image';
import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { pagePath } from '@/lib/nav-paths';
import type { NavPage, SiteSettings } from '@/types/sanity';
import { NavBar, type NavItem } from './NavBar';

type LinkHref = ComponentProps<typeof Link>['href'];

interface SiteHeaderProps {
  locale: Locale;
  siteSettings: SiteSettings;
  navPages: NavPage[];
}

export function SiteHeader({ locale, navPages }: SiteHeaderProps) {
  const homeHref = pagePath(locale, 'home', navPages) as LinkHref;

  const navItems: NavItem[] = [
    { label: 'Home', href: homeHref },
    {
      label: 'About',
      dropdown: [
        { label: 'About', href: pagePath(locale, 'about', navPages) as LinkHref },
        {
          label: 'Vietnam Production Service',
          href: pagePath(
            locale,
            'vietnam-production-service',
            navPages,
          ) as LinkHref,
        },
      ],
    },
    { label: 'Work', href: pagePath(locale, 'work', navPages) as LinkHref },
    { label: 'News', href: pagePath(locale, 'news', navPages) as LinkHref },
    { label: 'Contact', isContact: true },
  ];

  return (
    <header>
      <nav
        id="header"
        className="navbar fixed top-0 z-50 w-full px-2.5 py-[1.1rem]"
        aria-label="Primary navigation"
      >
        <div className="container-fluid relative z-[1] mx-auto flex w-full max-w-[100%] flex-wrap items-center px-2.5">
          <Link className="navbar-brand shrink-0" href={homeHref} rel="home">
            <Image
              src="/brand/Brand_Vantage_v2_LIGHT.png"
              alt="Vantage Pictures"
              width={200}
              height={90}
              priority
              className="block h-[46px] w-auto sm:h-[51px] md:h-[90px]"
            />
          </Link>

          <NavBar locale={locale} items={navItems} />
        </div>
      </nav>
    </header>
  );
}
