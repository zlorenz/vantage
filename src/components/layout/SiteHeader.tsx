/**
 * SiteHeader — fixed top navigation bar (server component).
 *
 * Receives siteSettings and navPages from the locale layout (single fetch).
 * Logo is the Vantage wordmark SVG in /public/brand/. Interactive nav is
 * delegated to the NavBar client component.
 */

import type { ComponentProps } from 'react';
import { getTranslations } from 'next-intl/server';
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

export async function SiteHeader({ locale, navPages }: SiteHeaderProps) {
  const t = await getTranslations('Nav');
  const homeHref = pagePath(locale, 'home', navPages) as LinkHref;

  const navItems: NavItem[] = [
    { label: t('home'), href: homeHref },
    {
      label: t('about'),
      dropdown: [
        {
          label: t('about'),
          href: pagePath(locale, 'about', navPages) as LinkHref,
        },
        {
          label: t('vietnamProductionService'),
          href: pagePath(
            locale,
            'vietnam-production-service',
            navPages,
          ) as LinkHref,
        },
      ],
    },
    { label: t('work'), href: pagePath(locale, 'work', navPages) as LinkHref },
    { label: t('news'), href: pagePath(locale, 'news', navPages) as LinkHref },
    { label: t('contact'), isContact: true },
  ];

  return (
    <header>
      <nav
        id="header"
        className="navbar fixed top-0 z-50 w-full px-2.5 py-[1.1rem]"
        aria-label={t('primaryAria')}
      >
        <div className="container-fluid relative z-[1] mx-auto flex w-full max-w-[100%] flex-wrap items-center px-2.5">
          <Link className="navbar-brand shrink-0" href={homeHref} rel="home">
            {/* SVG via <img> — next/image does not optimize SVGs */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/vantage-wordmark.svg"
              alt="Vantage Pictures"
              width={220}
              height={36}
              className="block h-6 w-auto sm:h-7 md:h-8"
            />
          </Link>

          <NavBar locale={locale} items={navItems} toggleAria={t('toggleAria')} />
        </div>
      </nav>
    </header>
  );
}
