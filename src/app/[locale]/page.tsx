/**
 * Home page placeholder — verifies next-intl locale routing.
 * Replaced with CMS-driven homepage in Milestone 3 page build-out.
 */

import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';

type Props = {
  params: Promise<{ locale: string }>;
};

export default function HomePage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations('Test');

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <p className="text-vp-text-muted text-sm uppercase tracking-vp-uppercase">
        {locale === 'zh' ? '中文' : 'English'} / {locale}
      </p>
      <h1 className="mt-4 text-center font-vp-sans text-3xl font-bold uppercase tracking-vp-heading">
        {t('message')}
      </h1>
    </main>
  );
}
