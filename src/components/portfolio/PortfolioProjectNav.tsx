/**
 * PortfolioProjectNav — end-of-case “next project” carousel (Figma 92:40293).
 * Server wrapper: thin chronological ring + seed cards; client hydrates more.
 */

import type {Locale} from '@/i18n/routing'
import {loadPortfolioNavData} from '@/lib/portfolio-nav.server'
import {getPhraseRecord} from '@/lib/phrase-book'
import {PortfolioProjectNavClient} from './PortfolioProjectNavClient'
import './portfolio-project-nav.css'

type PortfolioProjectNavProps = {
  currentId: string
  locale: Locale
}

export async function PortfolioProjectNav({
  currentId,
  locale,
}: PortfolioProjectNavProps) {
  const [data, phrases] = await Promise.all([
    loadPortfolioNavData(currentId),
    getPhraseRecord(),
  ])
  if (!data) return null

  return (
    <PortfolioProjectNavClient
      locale={locale}
      phrases={phrases}
      slides={data.slides}
      initialCards={data.initialCards}
      catalogLength={data.catalogLength}
    />
  )
}
