/**
 * Public showreel share page — ungated.
 * `/zh/showreel/[id]` mirrors English content (no locale-specific copy for v1).
 */

import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {setRequestLocale} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'
import {ShowreelPublicGrid} from '@/components/showreel/ShowreelPublicGrid'
import type {ShowreelPublicData} from '@/components/showreel/showreel-public-types'
import {SectionWrapper} from '@/components/ui/SectionWrapper'
import {sanityFetch} from '@/sanity/lib/live'
import {SHOWREEL_PUBLIC_QUERY} from '@/sanity/queries/showreel'

type Props = {
  params: Promise<{locale: string; id: string}>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {id} = await params
  const {data} = await sanityFetch({
    query: SHOWREEL_PUBLIC_QUERY,
    params: {id},
    stega: false,
  })
  const showreel = data as ShowreelPublicData | null
  if (!showreel?._id) {
    return {title: 'Showreel | Vantage Pictures', robots: {index: false}}
  }
  return {
    title: `${showreel.title} | Vantage Pictures`,
    description: showreel.description || undefined,
    robots: {index: false, follow: false},
  }
}

export default async function ShowreelPublicPage({params}: Props) {
  const {locale, id} = await params
  const typedLocale = locale as Locale
  setRequestLocale(typedLocale)

  const {data} = await sanityFetch({
    query: SHOWREEL_PUBLIC_QUERY,
    params: {id},
    stega: false,
  })
  const showreel = data as ShowreelPublicData | null

  if (!showreel?._id || !showreel.title) {
    notFound()
  }

  const items = (showreel.items ?? []).filter(
    (item): item is NonNullable<typeof item> =>
      Boolean(item?._id && item.featuredImage && item.slug),
  )
  const description = showreel.description?.trim() || ''

  return (
    <SectionWrapper
      fullBleed
      className="vp-news-page vp-showreel-page !pt-[var(--vp-section-y-header-condensed)]"
    >
      <div className="vp-news-page__chrome">
        <header className="vp-news-page__header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="vp-news-page__motif"
            src="/brand/vap-pattern.svg"
            alt=""
            aria-hidden="true"
          />
          <div className="vp-news-page__heading">
            <p className="vp-news-page__eyebrow">●  Custom Showreel</p>
            <div className="vp-news-page__title-block">
              <h1 className="vp-news-page__title">{showreel.title}</h1>
              {description ? (
                <div className="vp-news-page__intro">
                  <p>{description}</p>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <div className="vp-news-page__rule" aria-hidden="true" />
      </div>

      {items.length > 0 ? (
        <ShowreelPublicGrid items={items} locale={typedLocale} />
      ) : (
        <p className="vp-showreel-page__empty">
          This showreel has no projects yet.
        </p>
      )}
    </SectionWrapper>
  )
}
