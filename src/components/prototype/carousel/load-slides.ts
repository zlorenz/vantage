import {phraseRecordToMap} from '@phrase-book';
import type {Locale} from '@/i18n/routing';
import {getStructuredRoleNames} from '@/lib/credits-config';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import {getPhraseRecord} from '@/lib/phrase-book';
import {sanityClient, urlForImage} from '@/lib/sanity';
import type {CrewCredit, DisplayTitlePartsValue, SanityImage} from '@/types/sanity';
import {composeOverlayCopy, joinOverlayList} from './overlay';
import {PROTOTYPE_CAROUSEL_ENTRIES_QUERY} from './query';
import {PROTOTYPE_CAROUSEL_SLUGS} from './slugs';
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

export async function loadFeaturedWorkSlides(
  locale: Locale,
): Promise<PrototypeCarouselSlide[]> {
  const [entriesResult, phrases] = await Promise.all([
    sanityClient.fetch<CarouselEntry[]>(PROTOTYPE_CAROUSEL_ENTRIES_QUERY, {
      slugs: [...PROTOTYPE_CAROUSEL_SLUGS],
    }),
    getPhraseRecord(),
  ]);

  const entries = entriesResult ?? [];
  const bySlug = new Map(
    entries
      .filter((entry): entry is CarouselEntry & {slug: string} => Boolean(entry.slug))
      .map((entry) => [entry.slug, entry]),
  );
  const phraseMap = phraseRecordToMap(phrases);

  return PROTOTYPE_CAROUSEL_SLUGS.flatMap((slug) => {
    const entry = bySlug.get(slug);
    if (!entry) return [];

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

    return [
      {
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
      },
    ];
  });
}
