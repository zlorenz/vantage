/**
 * Search page — client UI with debounced API search.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SearchPageClient } from '@/components/search/SearchPageClient';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { sanityClient } from '@/lib/sanity';
import { SITE_NAME } from '@/lib/metadata';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Search | ${SITE_NAME}`,
    alternates: {
      languages: { en: '/search', zh: '/zh/search' },
    },
  };
}

export default async function SearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  return (
    <SectionWrapper className="vp-search-page">
      <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
        <h1 className="mb-8 text-[clamp(2rem,4vw,3.5rem)] font-bold uppercase leading-tight">
          {typedLocale === 'zh' ? '搜索' : 'Search'}
        </h1>
        <Suspense fallback={<div className="vp-load-spinner" />}>
          <SearchPageClient locale={typedLocale} />
        </Suspense>
      </div>
    </SectionWrapper>
  );
}
