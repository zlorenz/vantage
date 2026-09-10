/**
 * Work Internal — single project detail (noindex).
 * Temporary path: /work-internal/[slug] → app.vantage.pictures/[slug] at launch.
 */

import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {WorkInternalDetail} from '@/components/work-internal/WorkInternalDetail';
import {getDisplayTitle} from '@/components/work-internal/text';
import type {Locale} from '@/i18n/routing';
import {decodePathSlug} from '@/lib/path-slug';
import {sanityFetch} from '@/sanity/lib/live';
import {INTERNAL_LIBRARY_ENTRY_BY_SLUG_QUERY} from '@/sanity/queries/portfolio';
import type {InternalLibraryEntry} from '@/types/sanity';

type Props = {
  params: Promise<{locale: string; slug: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug: rawSlug} = await params;
  const slug = decodePathSlug(rawSlug);
  const result = await sanityFetch({
    query: INTERNAL_LIBRARY_ENTRY_BY_SLUG_QUERY,
    params: {slug},
    stega: false,
  });
  const entry = result.data as InternalLibraryEntry | null;
  if (!entry) {
    return {
      title: 'Not Found | Work Library',
      robots: {index: false, follow: false},
    };
  }
  const title = getDisplayTitle(entry, locale as Locale);
  return {
    title: `${title} | Work Library`,
    robots: {index: false, follow: false},
  };
}

export default async function WorkInternalEntryPage({params}: Props) {
  const {locale, slug: rawSlug} = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const slug = decodePathSlug(rawSlug);

  const result = await sanityFetch({
    query: INTERNAL_LIBRARY_ENTRY_BY_SLUG_QUERY,
    params: {slug},
    stega: false,
  });
  const entry = result.data as InternalLibraryEntry | null;

  if (!entry?.slug) {
    notFound();
  }

  return (
    <div className="vp-internal-page">
      <WorkInternalDetail entry={entry} locale={typedLocale} />
    </div>
  );
}
