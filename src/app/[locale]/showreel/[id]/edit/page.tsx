/**
 * Showreel editor — password-gated via proxy.ts (`isShowreelEditPath`).
 */

import type {Metadata} from 'next'
import {setRequestLocale} from 'next-intl/server'
import {Link} from '@/i18n/navigation'
import {workInternalLibraryHref} from '@/lib/internal-app-paths'
import type {Locale} from '@/i18n/routing'
import {ShowreelEditor} from '@/components/showreel/ShowreelEditor'
import {WorkInternalUtilityChrome} from '@/components/work-internal/WorkInternalUtilityChrome'
import {sanityFetch} from '@/sanity/lib/live'
import {INTERNAL_LIBRARY_QUERY} from '@/sanity/queries/portfolio'
import {SHOWREEL_EDITOR_QUERY} from '@/sanity/queries/showreel'
import type {InternalLibraryEntry} from '@/types/sanity'

type Props = {
  params: Promise<{locale: string; id: string}>
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Showreel Editor | Vantage Pictures',
  robots: {index: false, follow: false},
}

export default async function ShowreelEditPage({params}: Props) {
  const {locale, id} = await params
  const typedLocale = locale as Locale
  setRequestLocale(typedLocale)

  const [showreelResult, libraryResult] = await Promise.all([
    sanityFetch({
      query: SHOWREEL_EDITOR_QUERY,
      params: {id},
      stega: false,
    }),
    sanityFetch({query: INTERNAL_LIBRARY_QUERY, stega: false}),
  ])

  const showreel = showreelResult.data as {
    _id: string
    title?: string
    description?: string
    items?: Array<{
      _id: string
      title: string
      titleZh?: string
      displayTitleParts?: InternalLibraryEntry['displayTitleParts']
      featuredImage?: InternalLibraryEntry['featuredImage']
      slug?: string
      slugZh?: string
    } | null>
  } | null

  if (!showreel?._id || !showreel.title) {
    return (
      <div className="vp-internal-page vp-internal-page--utility">
        <WorkInternalUtilityChrome navTitle="Showreel editor" showBack>
          <div className="vp-showreel-editor">
            <header className="vp-showreel-editor__header">
              <h1 className="vp-internal-app__title">Showreel not found</h1>
            </header>
            <p className="vp-showreel-editor__hint">
              This showreel doesn’t exist or was already deleted.
            </p>
            <p className="vp-showreel-editor__id">
              <code>{id}</code>
            </p>
            <p>
              <Link
                href={workInternalLibraryHref()}
                className="vp-internal-clear"
              >
                Back to Work Library
              </Link>
            </p>
          </div>
        </WorkInternalUtilityChrome>
      </div>
    )
  }

  const library = libraryResult.data as InternalLibraryEntry[]
  const items = (showreel.items ?? []).filter(
    (item): item is NonNullable<typeof item> => Boolean(item?._id),
  )

  return (
    <div className="vp-internal-page vp-internal-page--utility">
      <WorkInternalUtilityChrome navTitle="Showreel editor" showBack>
        <ShowreelEditor
          locale={typedLocale}
          showreel={{
            _id: showreel._id,
            title: showreel.title,
            description: showreel.description,
            items,
          }}
          library={library}
        />
      </WorkInternalUtilityChrome>
    </div>
  )
}
