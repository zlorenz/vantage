/**
 * Resolve portfolio display titles from structured parts or overrides.
 */

import {
  resolveDisplayTitles as resolveShared,
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
};

export type AdditionalVideoTitleFields = {
  videoTitle?: string | null;
  videoTitleZh?: string | null;
};

function flatten(input: DisplayTitleFields): ResolveDisplayTitlesInput {
  const parts = input.displayTitleParts ?? {};
  return {
    brandName: parts.brandName ?? input.brandName,
    productName: parts.productName ?? input.productName,
    campaignTitle: parts.campaignTitle ?? input.campaignTitle,
    heroFilmTitle: parts.heroFilmTitle ?? input.heroFilmTitle,
    brandNameZh: parts.brandNameZh ?? input.brandNameZh,
    productNameZh: parts.productNameZh ?? input.productNameZh,
    campaignTitleZh: parts.campaignTitleZh ?? input.campaignTitleZh,
    heroFilmTitleZh: parts.heroFilmTitleZh ?? input.heroFilmTitleZh,
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
