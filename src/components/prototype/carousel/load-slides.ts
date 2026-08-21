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
      ? urlForImage(entry.featuredImage).width(1920).height(1080).fit('crop').url()
      : null;
    const parts = resolveEntryDisplayTitleParts(entry, locale, phraseMap);
    const {brandLine, campaignLine} = composeOverlayCopy(parts);
    const formatLine = joinOverlayList(
      (entry.videoFormats ?? []).map((format) =>
        pickLocaleFieldWithPhrases(locale, format.title, format.titleZh, phraseMap),
      ),
    );

    return {
      slug,
      hrefSlug: locale === 'zh' ? entry.slugZh || slug : slug,
      brandLine,
      campaignLine,
      directorNames: joinOverlayList(getStructuredRoleNames(entry.crewCredits ?? [], 'director')),
      dopNames: joinOverlayList(getStructuredRoleNames(entry.crewCredits ?? [], 'dop')),
      formatLine,
      posterUrl,
      vimeoUrl: entry.previewCleanVimeoUrl?.trim() || entry.vimeoUrl?.trim() || null,
      previewStartSeconds: entry.previewStartSeconds ?? null,
      previewEndSeconds: entry.previewEndSeconds ?? null,
    };
  });
}
