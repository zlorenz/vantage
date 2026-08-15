/**
 * Prototype-only featured-work carousel.
 * Not linked from the live homepage. Noindex. Hardcoded slug list.
 */

import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { FeaturedWorkCarousel } from '@/components/prototype/carousel/FeaturedWorkCarousel';
import { PROTOTYPE_CAROUSEL_ENTRIES_QUERY } from '@/components/prototype/carousel/query';
import { PROTOTYPE_CAROUSEL_SLUGS } from '@/components/prototype/carousel/slugs';
import {
  isCarouselAxis,
  type PrototypeCarouselSlide,
} from '@/components/prototype/carousel/types';
import { phraseRecordToMap } from '@phrase-book';
import { routing, type Locale } from '@/i18n/routing';
import { resolveEntryDisplayTitles } from '@/lib/display-titles';
import { getPhraseRecord } from '@/lib/phrase-book';
import { urlForImage } from '@/lib/sanity';
import { sanityFetch } from '@/sanity/lib/live';
import type { DisplayTitlePartsValue, SanityImage } from '@/types/sanity';

type PrototypeEntry = {
  _id: string;
  slug?: string | null;
  slugZh?: string | null;
  displayTitleParts?: DisplayTitlePartsValue | null;
  headerTitleOverride?: string | null;
  headerTitleOverrideZh?: string | null;
  featuredImage?: SanityImage | null;
  vimeoUrl?: string | null;
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ axis?: string | string[] }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Prototype Carousel | Vantage Pictures',
  robots: { index: false, follow: false },
};

export default async function PrototypeCarouselPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { axis: axisParam } = await searchParams;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const axisValue = Array.isArray(axisParam) ? axisParam[0] : axisParam;
  const initialAxis = isCarouselAxis(axisValue) ? axisValue : 'vertical';

  const [entriesResult, phrases] = await Promise.all([
    sanityFetch({
      query: PROTOTYPE_CAROUSEL_ENTRIES_QUERY,
      params: { slugs: [...PROTOTYPE_CAROUSEL_SLUGS] },
      stega: false,
    }),
    getPhraseRecord(),
  ]);

  const entries = (entriesResult.data ?? []) as PrototypeEntry[];
  const bySlug = new Map(
    entries
      .filter((entry): entry is PrototypeEntry & { slug: string } => Boolean(entry.slug))
      .map((entry) => [entry.slug, entry]),
  );
  const phraseMap = phraseRecordToMap(phrases);

  const slides: PrototypeCarouselSlide[] = PROTOTYPE_CAROUSEL_SLUGS.flatMap((slug) => {
    const entry = bySlug.get(slug);
    if (!entry) return [];

    const posterUrl = entry.featuredImage
      ? urlForImage(entry.featuredImage).width(1920).height(1080).fit('crop').url()
      : null;
    const { headerTitle } = resolveEntryDisplayTitles(entry, typedLocale, phraseMap);

    return [
      {
        slug,
        titleHtml: headerTitle,
        posterUrl,
        vimeoUrl: entry.vimeoUrl ?? null,
      },
    ];
  });

  return <FeaturedWorkCarousel slides={slides} initialAxis={initialAxis} />;
}
