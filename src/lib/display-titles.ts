/**
 * Resolve portfolio display titles from structured parts or overrides.
 */

import {
  resolveDisplayTitleParts as resolveSharedParts,
  resolveDisplayTitles as resolveShared,
  type DisplayTitleParts,
  type PhraseLookup,
  type ResolveDisplayTitlesInput,
} from '@display-titles';
import type { Locale } from '@/i18n/routing';

export type DisplayTitleFields = ResolveDisplayTitlesInput & {
  displayTitleParts?: {
    brandName?: string | null;
    productName?: string | null;
    campaignTitle?: string | null;
    heroFilmTitle?: string | null;
    brandNameZh?: string | null;
    productNameZh?: string | null;
    campaignTitleZh?: string | null;
    heroFilmTitleZh?: string | null;
  } | null;
  heroFilmTitle?: string | null;
  heroFilmTitleZh?: string | null;
  /** Unified videos — first item episode title maps to heroFilmTitle. */
  videos?: Array<{
    videoTitle?: string | null;
    videoTitleZh?: string | null;
  } | null> | null;
};

export type AdditionalVideoTitleFields = {
  videoTitle?: string | null;
  videoTitleZh?: string | null;
};

function flatten(input: DisplayTitleFields): ResolveDisplayTitlesInput {
  const parts = input.displayTitleParts ?? {};
  const mainVideo = input.videos?.[0];
  const heroFilmTitle =
    mainVideo?.videoTitle?.trim() ||
    parts.heroFilmTitle ||
    input.heroFilmTitle;
  const heroFilmTitleZh =
    mainVideo?.videoTitleZh?.trim() ||
    parts.heroFilmTitleZh ||
    input.heroFilmTitleZh;
  return {
    brandName: parts.brandName ?? input.brandName,
    productName: parts.productName ?? input.productName,
    campaignTitle: parts.campaignTitle ?? input.campaignTitle,
    heroFilmTitle,
    brandNameZh: parts.brandNameZh ?? input.brandNameZh,
    productNameZh: parts.productNameZh ?? input.productNameZh,
    campaignTitleZh: parts.campaignTitleZh ?? input.campaignTitleZh,
    heroFilmTitleZh,
    thumbTitleOverride: input.thumbTitleOverride,
    headerTitleOverride: input.headerTitleOverride,
    longTitleOverride: input.longTitleOverride,
    thumbTitleOverrideZh: input.thumbTitleOverrideZh,
    headerTitleOverrideZh: input.headerTitleOverrideZh,
    longTitleOverrideZh: input.longTitleOverrideZh,
  };
}

export function resolveEntryDisplayTitles(
  entry: DisplayTitleFields,
  locale: Locale,
  phrases?: PhraseLookup | null,
) {
  return resolveShared(
    flatten(entry),
    locale === 'zh' ? 'zh' : 'en',
    phrases,
  );
}

/**
 * Live-compile `documentTitle` from Brand/Product/Campaign parts (includes
 * brand/product dedup). Falls back to the stored `title` / `titleZh` fields
 * when parts cannot compile — those may still hold a pre-dedup snapshot until
 * the next Studio save.
 */
export function resolveEntryDocumentTitle(
  entry: DisplayTitleFields & {
    title?: string | null;
    titleZh?: string | null;
  },
  locale: Locale,
  phrases?: PhraseLookup | null,
): string {
  const compiled = resolveEntryDisplayTitles(entry, locale, phrases)
    .documentTitle.replace(/\s+/g, ' ')
    .trim();
  if (compiled) return compiled;
  if (locale === 'zh') {
    return (entry.titleZh?.trim() || entry.title?.trim() || '');
  }
  return entry.title?.trim() || '';
}

/** Locale-resolved title parts — not compiled header/long/thumb HTML. */
export function resolveEntryDisplayTitleParts(
  entry: DisplayTitleFields,
  locale: Locale,
  phrases?: PhraseLookup | null,
): DisplayTitleParts {
  return resolveSharedParts(
    flatten(entry),
    locale === 'zh' ? 'zh' : 'en',
    phrases,
  );
}

/**
 * Compose an additional-video Full title: Brand + Product + Campaign + outlined episode.
 * Same compiler path as heroFilmTitle on the main player.
 */
export function resolveAdditionalVideoTitle(
  entry: DisplayTitleFields,
  video: AdditionalVideoTitleFields,
  locale: Locale,
  phrases?: PhraseLookup | null,
): string {
  const parts = entry.displayTitleParts ?? {};
  // Pass raw episode strings — do not trimPart here. trimPart shreds Sanity stega
  // (U+FEFF → spaces) before resolveDisplayTitles can stegaClean. Downstream
  // compile still trims after the choke-point clean.
  const episodeEn = video.videoTitle?.trim() ? video.videoTitle : undefined;
  const episodeZh = video.videoTitleZh?.trim() ? video.videoTitleZh : undefined;

  if (!episodeEn && !episodeZh) return '';

  return resolveEntryDisplayTitles(
    {
      ...entry,
      // Episode replaces hero for this row — do not inherit the main film's heroFilmTitle.
      heroFilmTitle: episodeEn,
      heroFilmTitleZh: episodeZh,
      displayTitleParts: {
        ...parts,
        heroFilmTitle: undefined,
        heroFilmTitleZh: undefined,
      },
      // Ignore full-title overrides for additional rows.
      longTitleOverride: undefined,
      longTitleOverrideZh: undefined,
    },
    locale,
    phrases,
  ).longTitle;
}
