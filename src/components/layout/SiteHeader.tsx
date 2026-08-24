/**
 * SiteHeader — fixed top navigation bar (server component).
 *
 * Receives siteSettings and navPages from the locale layout (single fetch).
 * Logo is the Vantage wordmark SVG in /public/brand/. Interactive nav is
 * delegated to the NavBar client component; scroll hide/show lives in
 * SiteHeaderNav (also client).
 */

import type { ComponentProps } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getNavLabel } from '@/lib/nav';
import { pagePath } from '@/lib/nav-paths';
import type { NavPage, SiteSettings } from '@/types/sanity';
import { NavBar, type NavItem } from './NavBar';
import { SiteHeaderNav } from './SiteHeaderNav';

type LinkHref = ComponentProps<typeof Link>['href'];

interface SiteHeaderProps {
  locale: Locale;
  siteSettings: SiteSettings;
  navPages: NavPage[];
}

function pageBySlug(navPages: NavPage[], slug: string): NavPage | undefined {
  return navPages.find((p) => p.slug === slug);
}

export async function SiteHeader({ locale, navPages, siteSettings }: SiteHeaderProps) {
  const t = await getTranslations('Nav');
  const homeHref = pagePath(locale, 'home', navPages) as LinkHref;

  const home = pageBySlug(navPages, 'home');
  const about = pageBySlug(navPages, 'about');
  const work = pageBySlug(navPages, 'work');
  const news = pageBySlug(navPages, 'news');

  const navItems: NavItem[] = [
    {
      label: home ? getNavLabel(home, locale) : t('home'),
      href: homeHref,
    },
    {
      label: work ? getNavLabel(work, locale) : t('work'),
      href: pagePath(locale, 'work', navPages) as LinkHref,
    },
    {
      label: about ? getNavLabel(about, locale) : t('about'),
      href: pagePath(locale, 'about', navPages) as LinkHref,
    },
    {
      label: news ? getNavLabel(news, locale) : t('news'),
      href: pagePath(locale, 'news', navPages) as LinkHref,
    },
    {
      label: t('contact'),
      href: pagePath(locale, 'contact', navPages) as LinkHref,
    },
  ];

  return (
    <header>
      <SiteHeaderNav
        className="navbar fixed top-0 z-50 w-full py-[0.9rem] md:py-[1.1rem]"
        aria-label={t('primaryAria')}
      >
        <div className="container-fluid relative z-[1] mx-auto flex w-full max-w-[100%] flex-wrap items-center px-[1.0625rem] md:px-[var(--spacing-vp-gutter)]">
          <Link className="navbar-brand shrink-0" href={homeHref} rel="home">
            {/* SVG via <img> — next/image does not optimize SVGs */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/vantage-wordmark.svg"
              alt="Vantage Pictures"
              width={220}
              height={36}
              className="block h-5 w-auto sm:h-7 md:h-7"
            />
          </Link>

          <NavBar
            locale={locale}
            items={navItems}
            toggleAria={t('toggleAria')}
            contactEmail={siteSettings.contactEmail}
            briefLabel={t('sendBrief')}
            briefHref={
              pagePath(locale, 'video-campaign-brief', navPages) as LinkHref
            }
          />
        </div>
      </SiteHeaderNav>
    </header>
  );
}
