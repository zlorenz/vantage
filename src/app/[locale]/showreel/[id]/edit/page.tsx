/**
 * Showreel editor stub — password-gated via proxy.ts (auth infrastructure).
 * Full editor UI lands in a later prompt.
 */

import type {Metadata} from 'next'
import {setRequestLocale} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'

type Props = {
  params: Promise<{locale: string; id: string}>
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Showreel Editor | Vantage Pictures',
  robots: {index: false, follow: false},
}

export default async function ShowreelEditStubPage({params}: Props) {
  const {locale, id} = await params
  setRequestLocale(locale as Locale)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 font-vp-heading text-2xl font-bold uppercase tracking-vp-heading">
        Showreel editor
      </h1>
      <p className="text-vp-text-muted">
        Authenticated stub for showreel <code>{id}</code>. Editor UI coming
        next.
      </p>
    </div>
  )
}
