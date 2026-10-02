/**
 * Localized 404.
 *
 * Rendered in place of a page when that page calls notFound() - missing
 * portfolio slugs, unpublished posts, unknown categories, and so on.
 * It is a child of [locale]/layout, so SiteHeader and SiteFooter stay in place.
 *
 * Copy lives in messages/en.json and messages/zh.json under "NotFound".
 */

import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import './not-found.css';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

/** Same northeast arrow as the nav Send a Brief control. */
function BriefArrowIcon() {
  return (
    <svg
      className="vp-not-found__action-arrow"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M4.2 12.9 11.4 5.7H6.75V4.2H14.1v7.35h-1.5V6.9L5.4 14.1z"
      />
    </svg>
  );
}

export default async function NotFoundPage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations('NotFound');
  const homeLabel = t('home');
  const workLabel = t('work');

  return (
    <section className="vp-not-found" lang={locale as Locale}>
      <p className="vp-not-found__code" aria-hidden="true">
        404
      </p>
      <h1 className="vp-not-found__title">{t('title')}</h1>
      <p className="vp-not-found__body">{t('body')}</p>
      <div className="vp-not-found__actions">
        <Link href="/" className="vp-not-found__action vp-not-found__action--home">
          <span className="vp-not-found__action-label">{homeLabel}</span>
        </Link>
        <Link href="/work" className="vp-not-found__action vp-not-found__action--work">
          <span className="vp-not-found__action-label">{workLabel}</span>
          <BriefArrowIcon />
        </Link>
      </div>
    </section>
  );
}
