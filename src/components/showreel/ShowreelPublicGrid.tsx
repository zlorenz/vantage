/**
 * Public showreel grid + video lightbox shell.
 */

'use client'

import {useCallback, useState} from 'react'
import {ShowreelPortfolioCard} from './ShowreelPortfolioCard'
import {ShowreelVideoLightbox} from './ShowreelVideoLightbox'
import type {ShowreelPublicItem} from './showreel-public-types'

interface ShowreelPublicGridProps {
  items: ShowreelPublicItem[]
}

export function ShowreelPublicGrid({items}: ShowreelPublicGridProps) {
  const [active, setActive] = useState<ShowreelPublicItem | null>(null)

  const close = useCallback(() => setActive(null), [])

  return (
    <>
      <div className="vp-curated-gallery grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <ShowreelPortfolioCard
            key={item._id}
            item={item}
            revealIndex={index}
            onPlay={setActive}
          />
        ))}
      </div>
      {active ? (
        <ShowreelVideoLightbox item={active} onClose={close} />
      ) : null}
    </>
  )
}
