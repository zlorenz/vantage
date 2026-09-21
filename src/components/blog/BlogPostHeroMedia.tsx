/**
 * BlogPostHeroMedia — relatedCase PortfolioCaseMedia, else mainVideo, else featuredImage.
 * Brand/campaign overlay only when relatedCase is set (Figma 2281:13248).
 */

import Image from 'next/image';
import {composeOverlayCopy} from '@/components/prototype/carousel/overlay';
import {PortfolioCaseMedia} from '@/components/portfolio/PortfolioCaseMedia';
import {buildPortfolioCaseSlides} from '@/components/portfolio/prepare-portfolio-case-slides';
import {PortableTextVideoEmbed} from '@/components/ui/PortableTextVideoEmbed';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import {urlForImage} from '@/lib/sanity';
import type {Locale} from '@/i18n/routing';
import type {PhraseLookup} from '@display-titles';
import type {PortfolioEntry} from '@/types/sanity';
import type {
  BlogPostMainVideo,
  BlogPostRelatedCase,
  SanityImage,
} from '@/types/sanity';
import type {PortfolioVideoSource} from '@portfolio-videos';
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
  featuredImage?: SanityImage | null;
};

export async function BlogPostHeroMedia({
  locale,
  phrases,
  relatedCase,
  mainVideo,
  featuredImage,
}: BlogPostHeroMediaProps) {
  if (relatedCase?._id) {
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

    return (
      <div className="vp-blog-hero-media">
        <div
          className={
            caseCarouselSlides
              ? 'vp-blog-hero-media__case'
              : 'vp-blog-hero-media__case vp-blog-hero-media__case--single'
          }
        >
          <PortfolioCaseMedia
            locale={locale}
            entry={relatedCase as CaseMediaEntry}
            caseCarouselSlides={caseCarouselSlides}
          />
        </div>
        {brandLine || campaignLine ? (
          <div className="vp-blog-hero-media__overlay">
            {brandLine ? (
              <p className="vp-blog-hero__brand">{`●  ${brandLine}`}</p>
            ) : null}
            {campaignLine ? (
              <p className="vp-blog-hero__campaign">{campaignLine}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  const videoUrl = mainVideo?.url?.trim();
  if (videoUrl) {
    return (
      <div className="vp-blog-hero-media vp-blog-hero-media--embed">
        <PortableTextVideoEmbed url={videoUrl} />
      </div>
    );
  }

  if (featuredImage) {
    const imageUrl = urlForImage(featuredImage).width(1920).height(1080).fit('crop').url();
    return (
      <div className="vp-blog-hero-media vp-blog-hero-media--image">
        <Image
          src={imageUrl}
          alt=""
          width={1920}
          height={1080}
          className="vp-blog-hero-media__image"
          sizes="100vw"
          priority
        />
      </div>
    );
  }

  return null;
}
