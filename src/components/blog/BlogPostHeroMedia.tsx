/**
 * BlogPostHeroMedia — relatedCase PortfolioCaseMedia, else mainVideo embed.
 * No featuredImage fallback — if neither video source is set, render nothing.
 *
 * Multi-video relatedCase: titles live on each carousel slide (brand +
 * "campaign: episode") via blogTitleOverlay — no static overlay on top.
 * Single relatedCase / mainVideo: logo-aligned left rail + static overlay
 * (same column as .vp-blog-hero__rail / case carousel-row).
 */

import {composeOverlayCopy} from '@/components/prototype/carousel/overlay';
import {PortfolioCaseMedia} from '@/components/portfolio/PortfolioCaseMedia';
import {buildPortfolioCaseSlides} from '@/components/portfolio/prepare-portfolio-case-slides';
import {PortableTextVideoEmbed} from '@/components/ui/PortableTextVideoEmbed';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import type {Locale} from '@/i18n/routing';
import type {PhraseLookup} from '@display-titles';
import type {PortfolioEntry} from '@/types/sanity';
import type {
  BlogPostMainVideo,
  BlogPostRelatedCase,
} from '@/types/sanity';
import {
  resolveMainPortfolioVideo,
  type PortfolioVideoSource,
} from '@portfolio-videos';
import type {ReactNode} from 'react';
import './blog-post-hero-media.css';

type CaseMediaEntry = Pick<
  PortfolioEntry,
  '_id' | 'featuredImage' | 'description' | 'descriptionZh'
> &
  PortfolioVideoSource;

type BlogPostHeroMediaProps = {
  locale: Locale;
  phrases?: Record<string, string> | null;
  relatedCase?: BlogPostRelatedCase | null;
  mainVideo?: BlogPostMainVideo | null;
};

function relatedCaseHasPlayableVideo(relatedCase: BlogPostRelatedCase): boolean {
  const main = resolveMainPortfolioVideo(relatedCase);
  return Boolean(
    main?.vimeoUrl?.trim() ||
      main?.xinpianchangUrl?.trim() ||
      relatedCase.vimeoUrl?.trim() ||
      relatedCase.xinpianchangUrl?.trim(),
  );
}

/** Single-video shell — empty rail column + framed media (multi uses carousel-row). */
function BlogHeroMediaWithRail({
  frameClassName,
  children,
  overlay,
}: {
  frameClassName?: string;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className="vp-blog-hero-media vp-blog-hero-media--with-rail">
      <div className="vp-blog-hero-media__rail" aria-hidden />
      <div
        className={
          frameClassName
            ? `vp-blog-hero-media__frame ${frameClassName}`
            : 'vp-blog-hero-media__frame'
        }
      >
        {children}
        {overlay}
      </div>
    </div>
  );
}

function BrandCampaignOverlay({
  brandLine,
  campaignLine,
}: {
  brandLine?: string;
  campaignLine?: string;
}) {
  if (!brandLine && !campaignLine) return null;
  return (
    <div className="vp-blog-hero-media__overlay">
      <div className="vp-blog-hero-media__overlay-scrim" aria-hidden />
      <div className="vp-blog-hero-media__overlay-copy">
        {brandLine ? (
          <p className="vp-blog-hero__brand">{`●  ${brandLine}`}</p>
        ) : null}
        {campaignLine ? (
          <p className="vp-blog-hero__campaign">{campaignLine}</p>
        ) : null}
      </div>
    </div>
  );
}

export async function BlogPostHeroMedia({
  locale,
  phrases,
  relatedCase,
  mainVideo,
}: BlogPostHeroMediaProps) {
  if (relatedCase?._id && relatedCaseHasPlayableVideo(relatedCase)) {
    const caseCarouselSlides = await buildPortfolioCaseSlides({
      locale,
      phrases: phrases ?? null,
      portfolioEntryRef: relatedCase._id,
      featuredImage: relatedCase.featuredImage,
      description: relatedCase.description,
      descriptionZh: relatedCase.descriptionZh,
      videos: relatedCase.videos,
      vimeoUrl: relatedCase.vimeoUrl,
      xinpianchangUrl: relatedCase.xinpianchangUrl,
      heroFilmTitle: relatedCase.heroFilmTitle,
      heroFilmTitleZh: relatedCase.heroFilmTitleZh,
      additionalVideos: relatedCase.additionalVideos,
    });

    const parts = resolveEntryDisplayTitleParts(
      {displayTitleParts: relatedCase.displayTitleParts},
      locale,
      phrases as PhraseLookup | null | undefined,
    );
    const {brandLine, campaignLine} = composeOverlayCopy(parts);
    const isMulti = Boolean(caseCarouselSlides?.length);

    if (isMulti) {
      return (
        <div className="vp-blog-hero-media">
          <div className="vp-blog-hero-media__case">
            <PortfolioCaseMedia
              locale={locale}
              entry={relatedCase as CaseMediaEntry}
              caseCarouselSlides={caseCarouselSlides}
              blogTitleOverlay={{
                brandLine: brandLine || undefined,
                campaignLine: campaignLine || undefined,
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <BlogHeroMediaWithRail
        overlay={
          <BrandCampaignOverlay
            brandLine={brandLine || undefined}
            campaignLine={campaignLine || undefined}
          />
        }
      >
        <div className="vp-blog-hero-media__case vp-blog-hero-media__case--single">
          <PortfolioCaseMedia
            locale={locale}
            entry={relatedCase as CaseMediaEntry}
            caseCarouselSlides={caseCarouselSlides}
            blogTitleOverlay={null}
          />
        </div>
      </BlogHeroMediaWithRail>
    );
  }

  const videoUrl = mainVideo?.url?.trim();
  if (videoUrl) {
    const videoTitle = mainVideo?.title?.trim();
    return (
      <BlogHeroMediaWithRail
        frameClassName="vp-blog-hero-media__frame--embed"
        overlay={
          videoTitle ? (
            <BrandCampaignOverlay campaignLine={videoTitle} />
          ) : null
        }
      >
        <PortableTextVideoEmbed url={videoUrl} />
      </BlogHeroMediaWithRail>
    );
  }

  return null;
}
