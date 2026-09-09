/**
 * ShowreelPortfolioCard — poster play (lightbox) + independent Explore link.
 */

'use client'

import Image from 'next/image'
import {urlForImage} from '@/lib/sanity'
import {resolveEntryDisplayTitles} from '@/lib/display-titles'
import type {ShowreelPublicItem} from './showreel-public-types'
import {showreelItemVideoUrls} from './showreel-public-types'

interface ShowreelPortfolioCardProps {
  item: ShowreelPublicItem
  revealIndex?: number
  onPlay: (item: ShowreelPublicItem) => void
}

export function ShowreelPortfolioCard({
  item,
  revealIndex = 0,
  onPlay,
}: ShowreelPortfolioCardProps) {
  if (!item.featuredImage || !item.slug) return null

  const imageUrl = urlForImage(item.featuredImage)
    .width(960)
    .height(540)
    .fit('crop')
    .url()

  // Public showreel is English-only for v1 (ZH route mirrors EN).
  const {thumbTitle} = resolveEntryDisplayTitles(
    {
      displayTitleParts: item.displayTitleParts ?? undefined,
      thumbTitleOverride: item.thumbTitleOverride ?? undefined,
    },
    'en',
  )
  const exploreHref = `/portfolio/${item.slug}`
  const {vimeoUrl, xinpianchangUrl} = showreelItemVideoUrls(item)
  const hasVideo = Boolean(vimeoUrl || xinpianchangUrl)

  return (
    <article
      className="vp-showreel-card vp-card-reveal"
      style={{animationDelay: `${revealIndex * 40}ms`}}
    >
      <button
        type="button"
        className="vp-showreel-card__poster group"
        onClick={() => onPlay(item)}
        aria-label={
          hasVideo
            ? `Play ${item.title}`
            : `Open video for ${item.title}`
        }
        disabled={!hasVideo}
      >
        <div className="vp-showreel-card__media">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 575px) 100vw, (max-width: 992px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="vp-card__overlay" aria-hidden />
          {hasVideo ? (
            <span className="vp-showreel-card__play" aria-hidden>
              <span className="vp-showreel-card__play-circle">
                <span className="vp-showreel-card__play-triangle" />
              </span>
            </span>
          ) : null}
          <h2
            className="vp-card__title"
            dangerouslySetInnerHTML={{__html: thumbTitle}}
          />
        </div>
      </button>

      <a
        href={exploreHref}
        target="_blank"
        rel="noopener noreferrer"
        className="vp-showreel-card__explore"
      >
        Explore
      </a>
    </article>
  )
}
