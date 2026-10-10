/**
 * Showreel index — all producer-created showreels (app host).
 */

import type {Metadata} from 'next'
import {setRequestLocale} from 'next-intl/server'
import {ShowreelIndex} from '@/components/showreel/ShowreelIndex'
import {WorkInternalUtilityChrome} from '@/components/work-internal/WorkInternalUtilityChrome'
import {sanityFetch} from '@/sanity/lib/live'
import {SHOWREEL_INDEX_QUERY} from '@/sanity/queries/showreel'
import type {Locale} from '@/i18n/routing'

type Props = {
  params: Promise<{locale: string}>
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Showreels | Vantage Pictures',
  robots: {index: false, follow: false},
}

export default async function ShowreelIndexPage({params}: Props) {
  const {locale} = await params
  const typedLocale = locale as Locale
  setRequestLocale(typedLocale)

  const {data} = await sanityFetch({
    query: SHOWREEL_INDEX_QUERY,
    stega: false,
  })

  const showreels = (Array.isArray(data) ? data : []).filter(
    (row): row is {_id: string; title?: string | null; _updatedAt?: string | null} =>
      Boolean(row && typeof row === 'object' && '_id' in row && row._id),
  )

  return (
    <div className="vp-internal-page vp-internal-page--utility">
      <WorkInternalUtilityChrome
        navTitle="Showreels"
        sectionNav="showreels"
        showBack
      >
        <ShowreelIndex locale={typedLocale} showreels={showreels} />
      </WorkInternalUtilityChrome>
    </div>
  )
}
