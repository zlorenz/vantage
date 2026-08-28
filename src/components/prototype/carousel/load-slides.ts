import {phraseRecordToMap} from '@phrase-book';
import type {Locale} from '@/i18n/routing';
import {getStructuredRoleNames} from '@/lib/credits-config';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import {getPhraseRecord} from '@/lib/phrase-book';
import {urlForImage} from '@/lib/sanity';
import {sanityFetch} from '@/sanity/lib/live';
import type {CrewCredit, DisplayTitlePartsValue, SanityImage} from '@/types/sanity';
import {composeOverlayCopy, joinOverlayList} from './overlay';
import {HOME_REDESIGN_CAROUSEL_QUERY} from './query';
import type {PrototypeCarouselSlide} from './types';
import {CAROUSEL_RATIOS, objectPositionFromHotspot, posterSize} from '@carousel-ratios';

/**
 * Homepage carousel poster bakes match the Studio “Homepage Cards” guides so
 * a hotspot placed in Studio previews the same crop that renders in-app.
 */
const HOME_MOBILE_POSTER = posterSize(CAROUSEL_RATIOS.homeMobile);
const HOME_DESKTOP_POSTER = posterSize(CAROUSEL_RATIOS.homeDesktop, 120);

type CarouselFormat = {
  title?: string | null;
  titleZh?: string | null;
};

type CarouselEntry = {
  _id: string;
  slug?: string | null;
  slugZh?: string | null;
  displayTitleParts?: DisplayTitlePartsValue | null;
  crewCredits?: CrewCredit[] | null;
  videoFormats?: CarouselFormat[] | null;
  featuredImage?: SanityImage | null;
  vimeoUrl?: string | null;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  previewCleanVimeoUrl?: string | null;
};

type HomeRedesignCarouselResult = {
  carouselSlides?: CarouselEntry[] | null;
};

export async function loadFeaturedWorkSlides(
  locale: Locale,
): Promise<PrototypeCarouselSlide[]> {
  const [pageResult, phrases] = await Promise.all([
    sanityFetch({
      query: HOME_REDESIGN_CAROUSEL_QUERY,
      stega: false,
    }),
    getPhraseRecord(),
  ]);

  const page = pageResult.data as HomeRedesignCarouselResult | null;
  const entries = (page?.carouselSlides ?? []).filter(
    (entry): entry is CarouselEntry & {slug: string} => Boolean(entry?.slug),
  );
  const phraseMap = phraseRecordToMap(phrases);

  return entries.map((entry) => {
    const slug = entry.slug;
    const posterUrl = entry.featuredImage
      ? urlForImage(entry.featuredImage)
          .width(HOME_MOBILE_POSTER.width)
          .height(HOME_MOBILE_POSTER.height)
          .fit('crop')
          .url()
      : null;
    const posterUrlDesktop = entry.featuredImage
      ? urlForImage(entry.featuredImage)
          .width(HOME_DESKTOP_POSTER.width)
          .height(HOME_DESKTOP_POSTER.height)
          .fit('crop')
          .url()
      : null;
    const objectPosition = objectPositionFromHotspot(entry.featuredImage?.hotspot);
    const parts = resolveEntryDisplayTitleParts(entry, locale, phraseMap);
    const {brandLine, campaignLine} = composeOverlayCopy(parts);
    const formatLine = joinOverlayList(
      (entry.videoFormats ?? []).map((format) =>
        pickLocaleFieldWithPhrases(locale, format.title, format.titleZh, phraseMap),
      ),
    );

    return {
      portfolioEntryRef: entry._id,
      slug,
      hrefSlug: locale === 'zh' ? entry.slugZh || slug : slug,
      brandLine,
      campaignLine,
      directorNames: joinOverlayList(getStructuredRoleNames(entry.crewCredits ?? [], 'director')),
      dopNames: joinOverlayList(getStructuredRoleNames(entry.crewCredits ?? [], 'dop')),
      formatLine,
      posterUrl,
      posterUrlDesktop,
      objectPosition,
      vimeoUrl: entry.previewCleanVimeoUrl?.trim() || entry.vimeoUrl?.trim() || null,
      previewStartSeconds: entry.previewStartSeconds ?? null,
      previewEndSeconds: entry.previewEndSeconds ?? null,
    };
  });
}
