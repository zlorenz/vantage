/**
 * ShowreelIndex — table of all producer-created showreels.
 * Reuses work-internal list chrome so the layout matches the library table.
 * Whole row opens the editor; client open/copy sit outside the hit target.
 */

import Link from 'next/link'
import {getSiteOrigin} from '@/lib/site-hosts'
import type {Locale} from '@/i18n/routing'
import {showreelEditPath, showreelPublicPath} from '@/lib/showreel-urls'
import {formatPublishDate} from '@/components/work-internal/text'
import {ShowreelIndexClientActions} from './ShowreelIndexClientActions'

export type ShowreelIndexRow = {
  _id: string
  title?: string | null
  _createdAt?: string | null
  itemCount?: number | null
}

interface ShowreelIndexProps {
  locale: Locale
  showreels: ShowreelIndexRow[]
}

export function ShowreelIndex({locale, showreels}: ShowreelIndexProps) {
  const siteOrigin = getSiteOrigin()

  return (
    <div className="vp-showreel-index">
      <header className="vp-showreel-index__header">
        <h1 className="vp-internal-app__title">Showreels</h1>
        <p className="vp-showreel-index__lede">
          Open a row to edit a pitch page, or use the icons to open or copy the
          client link.
        </p>
      </header>

      {showreels.length === 0 ? (
        <p className="vp-internal-empty">
          No showreels yet. Select projects in the{' '}
          <Link href="/" className="vp-internal-clear">
            Full Work Library
          </Link>{' '}
          to create one.
        </p>
      ) : (
        <div
          className="vp-internal-list vp-showreel-index__list"
          role="table"
          aria-label="Showreels"
        >
          <div className="vp-internal-list__head" role="row">
            <span role="columnheader">Title</span>
            <span role="columnheader">Date created</span>
            <span role="columnheader">Items</span>
            <span role="columnheader">Client page</span>
          </div>
          <div className="vp-internal-list__body" role="rowgroup">
            {showreels.map((row) => {
              const title = row.title?.trim() || 'Untitled showreel'
              const editHref = showreelEditPath(row._id, locale)
              const clientHref = `${siteOrigin}${showreelPublicPath(row._id, locale)}`
              const itemCount =
                typeof row.itemCount === 'number' && row.itemCount >= 0
                  ? row.itemCount
                  : 0

              return (
                <div
                  key={row._id}
                  className="vp-internal-list__row"
                  role="row"
                >
                  <Link
                    href={editHref}
                    className="vp-internal-list__hit"
                    aria-label={`Edit ${title}`}
                  >
                    <span role="cell" className="vp-showreel-index__title">
                      {title}
                    </span>
                    <span role="cell" className="vp-showreel-index__meta">
                      {formatPublishDate(row._createdAt ?? undefined)}
                    </span>
                    <span role="cell" className="vp-showreel-index__meta">
                      {itemCount}
                    </span>
                  </Link>
                  <span role="cell" className="vp-showreel-index__client">
                    <ShowreelIndexClientActions
                      url={clientHref}
                      label={title}
                    />
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
