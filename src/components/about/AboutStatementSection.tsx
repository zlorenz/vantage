/**
 * AboutStatementSection — server wrapper for the /about display statement.
 *
 * Prefers curated About Media markers / film strip; falls back to portfolio.
 */

import {getLocale, getTranslations} from 'next-intl/server';
import {AboutHeroViewport} from '@/components/about/AboutHeroViewport';
import {AboutStatementAnimated} from '@/components/about/AboutStatementAnimated';
import {
  loadAboutMedia,
  resolveAboutImageList,
  type AboutStillMedia,
} from '@/lib/about-media';
import {urlForImage} from '@/lib/sanity';
import {sanityFetch} from '@/sanity/lib/live';
import {
  ABOUT_STATEMENT_FILM_STRIP_QUERY,
  ABOUT_STATEMENT_MARKERS_QUERY,
} from '@/sanity/queries/pages';
import type {ABOUT_STATEMENT_MARKERS_QUERY_RESULT} from '@/sanity/sanity.types';

const FILM_STRIP_COUNT = 5;
const MARKER_COUNT = 2;
const FILM_STRIP_TOTAL = FILM_STRIP_COUNT * 2;

function toPoster(
  entry: ABOUT_STATEMENT_MARKERS_QUERY_RESULT[number],
  width: number,
  height: number,
): AboutStillMedia {
  return {
    src: urlForImage(entry.featuredImage!).width(width).height(height).fit('crop').url(),
    alt: entry.title?.trim() || 'Portfolio still',
  };
}

export async function AboutStatementSection() {
  const [t, locale, aboutMedia] = await Promise.all([
    getTranslations('About'),
    getLocale(),
    loadAboutMedia(),
  ]);

  const curatedMarkers = resolveAboutImageList(
    aboutMedia?.statementMarkers,
    locale,
    MARKER_COUNT,
    {width: 585, height: 328},
  );
  const curatedFilm = resolveAboutImageList(
    aboutMedia?.statementFilmStrip,
    locale,
    FILM_STRIP_TOTAL,
    {width: 474, height: 640},
  );

  let markers: AboutStillMedia[];
  if (curatedMarkers) {
    markers = curatedMarkers;
  } else {
    const markerResult = await sanityFetch({
      query: ABOUT_STATEMENT_MARKERS_QUERY,
      stega: false,
    });
    const markerEntries = (markerResult.data ??
      []) as ABOUT_STATEMENT_MARKERS_QUERY_RESULT;
    markers = markerEntries
      .filter((entry) => entry.featuredImage)
      .slice(0, MARKER_COUNT)
      .map((entry) => toPoster(entry, 585, 328));
  }

  let filmPosters: AboutStillMedia[];
  if (curatedFilm) {
    filmPosters = curatedFilm;
  } else {
    const filmResult = await sanityFetch({
      query: ABOUT_STATEMENT_FILM_STRIP_QUERY,
      stega: false,
    });
    const filmEntries = (
      (filmResult.data ?? []) as ABOUT_STATEMENT_MARKERS_QUERY_RESULT
    ).filter((entry) => entry.featuredImage);
    filmPosters = filmEntries.map((entry) => toPoster(entry, 474, 640));
  }

  const filmStrips = {
    left: filmPosters.slice(0, FILM_STRIP_COUNT),
    right: filmPosters.slice(FILM_STRIP_COUNT, FILM_STRIP_TOTAL),
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
        markers={markers}
        filmStrips={filmStrips}
      />
    </>
  );
}
