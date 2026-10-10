/**
 * Showreel portfolio card — same chrome as /work?view=grid.
 * Opens the film lightbox instead of navigating to the case page.
 */

'use client'

import Image from 'next/image'
import {composeOverlayCopy} from '@/lib/overlay-copy'
import {
  resolveEntryDisplayTitleParts,
  resolveEntryDocumentTitle,
} from '@/lib/display-titles'
import {urlForImage} from '@/lib/sanity'
import type {Locale} from '@/i18n/routing'
import {PortfolioIndexGridHover} from '@/components/portfolio/PortfolioIndexGridHover'
import type {ShowreelPublicItem} from './showreel-public-types'
import {showreelPlayableVideos} from './showreel-public-types'
import '@/components/portfolio/portfolio-index-grid.css'

interface ShowreelPortfolioCardProps {
  item: ShowreelPublicItem
  locale: Locale
  onPlay: (item: ShowreelPublicItem) => void
}

export function ShowreelPortfolioCard({
  item,
  locale,
  onPlay,
}: ShowreelPortfolioCardProps) {
  if (!item.featuredImage || !item.slug) return null

  const imageUrl = urlForImage(item.featuredImage)
    .width(960)
    .height(540)
    .fit('crop')
    .url()

  const parts = resolveEntryDisplayTitleParts(item, locale)
  const {brandLine, campaignLine} = composeOverlayCopy(parts)
  const campaign =
    campaignLine && campaignLine !== brandLine ? campaignLine : ''
  const fallbackTitle =
    !brandLine && !campaign ? resolveEntryDocumentTitle(item, locale) : ''
  const campaignText = campaign || fallbackTitle
  const hasVideo = showreelPlayableVideos(item).length > 0
  const labelBase = campaignText || brandLine || item.title

  return (
    <li className="vp-portfolio-index__grid-item">
      <button
        type="button"
        className="vp-portfolio-index__grid-link"
        onClick={() => onPlay(item)}
        aria-label={
          hasVideo ? `Play ${labelBase}` : `Open video for ${labelBase}`
        }
        disabled={!hasVideo}
      >
        <div className="vp-portfolio-index__grid-media">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(min-width: 2800px) 25vw, (min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="vp-portfolio-index__grid-poster"
          />
          {brandLine || campaignText ? (
            <div className="vp-portfolio-index__grid-copy">
              {brandLine ? (
                <p className="vp-portfolio-index__grid-brand">{brandLine}</p>
              ) : null}
              {campaignText ? (
                <p className="vp-portfolio-index__grid-campaign">
                  {campaignText}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <PortfolioIndexGridHover />
      </button>
    </li>
  )
}
