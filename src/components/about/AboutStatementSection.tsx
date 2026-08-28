/**
 * AboutStatementSection — server wrapper for the /about display statement.
 *
 * Resolves copy via next-intl and passes plain strings to the client child
 * that owns layout animation (AboutStatementAnimated).
 */

import { getTranslations } from 'next-intl/server';
import { AboutHeroViewport } from '@/components/about/AboutHeroViewport';
import { AboutStatementAnimated } from '@/components/about/AboutStatementAnimated';
import { urlForImage } from '@/lib/sanity';
import { sanityFetch } from '@/sanity/lib/live';
import { ABOUT_STATEMENT_MARKERS_QUERY } from '@/sanity/queries/pages';
import type { ABOUT_STATEMENT_MARKERS_QUERY_RESULT } from '@/sanity/sanity.types';

export async function AboutStatementSection() {
  const [t, markerResult] = await Promise.all([
    getTranslations('About'),
    sanityFetch({ query: ABOUT_STATEMENT_MARKERS_QUERY, stega: false }),
  ]);

  const markerEntries = (markerResult.data ?? []) as ABOUT_STATEMENT_MARKERS_QUERY_RESULT;

  const markers = markerEntries
    .filter((entry) => entry.featuredImage)
    .slice(0, 2)
    .map((entry) => ({
      src: urlForImage(entry.featuredImage!).width(585).height(328).fit('crop').url(),
      alt: entry.title?.trim() || 'Portfolio still',
    }));

  return (
    <>
      <AboutHeroViewport />
      <AboutStatementAnimated
        line1={t('statementLine1')}
        line2={t('statementLine2')}
        line3={t('statementLine3')}
        line4={t('statementLine4')}
        line5={t('statementLine5')}
        line6={t('statementLine6')}
        markers={markers}
      />
    </>
  );
}
