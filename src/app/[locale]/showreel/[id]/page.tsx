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
  setRequestLocale(locale as Locale)

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

  return (
    <SectionWrapper
      fullBleed
      className="!pt-[var(--vp-section-y-header-condensed)]"
    >
      <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
        <header className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <h1 className="font-vp-heading text-[clamp(1.75rem,3vw,2.75rem)] font-bold uppercase leading-tight tracking-vp-heading">
            {showreel.title}
          </h1>
          {showreel.description ? (
            <p className="mt-4 text-base font-light leading-relaxed text-vp-text-muted md:text-lg">
              {showreel.description}
            </p>
          ) : null}
        </header>

        {items.length > 0 ? (
          <ShowreelPublicGrid items={items} />
        ) : (
          <p className="text-center text-vp-text-muted">
            This showreel has no projects yet.
          </p>
        )}
      </div>
    </SectionWrapper>
  )
}
