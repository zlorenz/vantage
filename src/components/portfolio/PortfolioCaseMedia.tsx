/**
 * Async portfolio media slot — carousel or single embed.
 * Isolated so loading.tsx / Suspense can stream while header data resolves.
 *
 * When `caseCarouselSlides` is provided by the page, slide building is skipped
 * so the page can choose single-video full-bleed vs multi-video carousel-row
 * layout without resolving posters twice. Internal Embla markup is unchanged
 * by the page shell — only the parent wrapper differs.
 */

import {Suspense} from 'react'
import {
  resolveMainPortfolioVideo,
  type PortfolioVideoSource,
} from '@portfolio-videos'
import {PortfolioCaseCarouselWithRail} from '@/components/portfolio/PortfolioCaseCarouselWithRail'
import {PortfolioVideoEmbed} from '@/components/portfolio/PortfolioVideoEmbed'
import {
  buildPortfolioCaseSlides,
  type PortfolioCaseSlide,
} from '@/components/portfolio/prepare-portfolio-case-slides'
import type {Locale} from '@/i18n/routing'
import {getPhraseRecord} from '@/lib/phrase-book'
import type {PortfolioEntry} from '@/types/sanity'
import '@/components/portfolio/portfolio-case-loading.css'

type PortfolioCaseMediaProps = {
  locale: Locale
  entry: Pick<
    PortfolioEntry,
    | '_id'
    | 'featuredImage'
    | 'description'
    | 'descriptionZh'
  > &
    PortfolioVideoSource
  /**
   * Pre-resolved carousel slides from the page (null = single embed).
   * Omit to resolve slides inside this component (legacy / fallback).
   */
  caseCarouselSlides?: PortfolioCaseSlide[] | null
}

async function PortfolioCaseMediaContent({
  locale,
  entry,
  caseCarouselSlides: slidesProp,
}: PortfolioCaseMediaProps) {
  let caseCarouselSlides = slidesProp
  if (caseCarouselSlides === undefined) {
    const phraseRecord = await getPhraseRecord()
    caseCarouselSlides = await buildPortfolioCaseSlides({
      locale,
      phrases: phraseRecord,
      portfolioEntryRef: entry._id,
      featuredImage: entry.featuredImage,
      description: entry.description,
      descriptionZh: entry.descriptionZh,
      videos: entry.videos,
      vimeoUrl: entry.vimeoUrl,
      xinpianchangUrl: entry.xinpianchangUrl,
      heroFilmTitle: entry.heroFilmTitle,
      heroFilmTitleZh: entry.heroFilmTitleZh,
      additionalVideos: entry.additionalVideos,
    })
  }

  if (caseCarouselSlides) {
    return <PortfolioCaseCarouselWithRail slides={caseCarouselSlides} />
  }

  const main = resolveMainPortfolioVideo(entry)

  return (
    <div className="vp-case-video">
      <PortfolioVideoEmbed
        locale={locale}
        vimeoUrl={main?.vimeoUrl ?? entry.vimeoUrl ?? ''}
        xinpianchangUrl={
          main?.xinpianchangUrl ?? entry.xinpianchangUrl ?? undefined
        }
        portfolioEntryRef={entry._id}
        featuredImage={entry.featuredImage}
      />
    </div>
  )
}

function PortfolioCaseLoadingVideoOnly() {
  return (
    <div className="vp-portfolio-case-loading__video" aria-hidden />
  )
}

export function PortfolioCaseMedia(props: PortfolioCaseMediaProps) {
  return (
    <Suspense fallback={<PortfolioCaseLoadingVideoOnly />}>
      <PortfolioCaseMediaContent {...props} />
    </Suspense>
  )
}
