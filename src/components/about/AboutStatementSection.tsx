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
import {
  ABOUT_STATEMENT_FILM_STRIP_QUERY,
  ABOUT_STATEMENT_MARKERS_QUERY,
} from '@/sanity/queries/pages';
import type { ABOUT_STATEMENT_MARKERS_QUERY_RESULT } from '@/sanity/sanity.types';

const FILM_STRIP_COUNT = 5;

function toPoster(entry: ABOUT_STATEMENT_MARKERS_QUERY_RESULT[number], width: number, height: number) {
  return {
    src: urlForImage(entry.featuredImage!).width(width).height(height).fit('crop').url(),
    alt: entry.title?.trim() || 'Portfolio still',
  };
}

export async function AboutStatementSection() {
  const [t, markerResult, filmResult] = await Promise.all([
    getTranslations('About'),
    sanityFetch({ query: ABOUT_STATEMENT_MARKERS_QUERY, stega: false }),
    sanityFetch({ query: ABOUT_STATEMENT_FILM_STRIP_QUERY, stega: false }),
  ]);

  const markerEntries = (markerResult.data ?? []) as ABOUT_STATEMENT_MARKERS_QUERY_RESULT;
  const filmEntries = ((filmResult.data ?? []) as ABOUT_STATEMENT_MARKERS_QUERY_RESULT).filter(
    (entry) => entry.featuredImage,
  );

  const markers = markerEntries
    .filter((entry) => entry.featuredImage)
    .slice(0, 2)
    .map((entry) => toPoster(entry, 585, 328));

  const filmPosters = filmEntries.map((entry) => toPoster(entry, 474, 640));
  const filmStrips = {
    left: filmPosters.slice(0, FILM_STRIP_COUNT),
    right: filmPosters.slice(FILM_STRIP_COUNT, FILM_STRIP_COUNT * 2),
  };

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
        filmStrips={filmStrips}
      />
    </>
  );
}
