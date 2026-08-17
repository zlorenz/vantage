/**
 * Search page — client UI with debounced API search.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SearchPageClient } from '@/components/search/SearchPageClient';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import {
  SITE_NAME,
  SEARCH_PAGE_DESCRIPTION,
  SEARCH_PAGE_DESCRIPTION_ZH,
  buildPageMetadata,
} from '@/lib/metadata';
import { getPhraseRecord } from '@/lib/phrase-book';
import { buildBreadcrumbs, homeBreadcrumb, searchBreadcrumb } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';

  return buildPageMetadata({
    locale: locale as Locale,
    enPath: '/search',
    zhPath: '/zh/search',
    title: isZh ? `搜索 | ${SITE_NAME}` : `Search | ${SITE_NAME}`,
    description: isZh ? SEARCH_PAGE_DESCRIPTION_ZH : SEARCH_PAGE_DESCRIPTION,
    type: 'website',
  });
}

export default async function SearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const t = await getTranslations('Search');
  const phrases = await getPhraseRecord();

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs([homeBreadcrumb(typedLocale), searchBreadcrumb(typedLocale)])}
      />
      <SectionWrapper className="vp-search-page" fullBleed={true}>
      <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
        <h1 className="mb-8 font-vp-heading text-[clamp(2rem,4vw,3.5rem)] font-bold uppercase leading-tight tracking-vp-heading">
          {t('title')}
        </h1>
        <Suspense fallback={<div className="vp-load-spinner" />}>
          <SearchPageClient locale={typedLocale} phrases={phrases} />
        </Suspense>
      </div>
    </SectionWrapper>
    </>
  );
}
