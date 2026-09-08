/**
 * Showreel editor login — shared password gate (noindex).
 */

import {Suspense} from 'react'
import type {Metadata} from 'next'
import {setRequestLocale} from 'next-intl/server'
import {ShowreelLoginForm} from '@/components/showreel/ShowreelLoginForm'
import {routing, type Locale} from '@/i18n/routing'

type Props = {
  params: Promise<{locale: string}>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}))
}

export const metadata: Metadata = {
  title: 'Showreel Editor Login | Vantage Pictures',
  robots: {index: false, follow: false},
}

export default async function ShowreelLoginPage({params}: Props) {
  const {locale} = await params
  setRequestLocale(locale as Locale)

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-center font-vp-heading text-2xl font-bold uppercase tracking-vp-heading">
        Showreel editor
      </h1>
      <p className="mb-8 text-center text-vp-text-muted">
        Enter the shared editor password to continue.
      </p>
      <Suspense fallback={<div className="vp-load-spinner" />}>
        <ShowreelLoginForm />
      </Suspense>
    </div>
  )
}
