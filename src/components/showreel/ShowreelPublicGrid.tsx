/**
 * Public showreel grid + video lightbox shell.
 * Grid chrome matches /work?view=grid; cards open the film lightbox.
 */

'use client'

import {useCallback, useState} from 'react'
import type {Locale} from '@/i18n/routing'
import {ShowreelPortfolioCard} from './ShowreelPortfolioCard'
import {ShowreelVideoLightbox} from './ShowreelVideoLightbox'
import type {ShowreelPublicItem} from './showreel-public-types'
import '@/components/portfolio/portfolio-index-grid.css'

interface ShowreelPublicGridProps {
  items: ShowreelPublicItem[]
  locale: Locale
}

export function ShowreelPublicGrid({items, locale}: ShowreelPublicGridProps) {
  const [active, setActive] = useState<ShowreelPublicItem | null>(null)

  const close = useCallback(() => setActive(null), [])

  return (
    <>
      <ul className="vp-portfolio-index__grid">
        {items.map((item) => (
          <ShowreelPortfolioCard
            key={item._id}
            item={item}
            locale={locale}
            onPlay={setActive}
          />
        ))}
      </ul>
      {active ? (
        <ShowreelVideoLightbox item={active} onClose={close} />
      ) : null}
    </>
  )
}
