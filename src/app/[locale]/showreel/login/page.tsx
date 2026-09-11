/**
 * Showreel editor login — shared password gate (noindex).
 */

import {Suspense} from 'react'
import type {Metadata} from 'next'
import {setRequestLocale} from 'next-intl/server'
import {ShowreelLoginForm} from '@/components/showreel/ShowreelLoginForm'
import {WorkInternalUtilityChrome} from '@/components/work-internal/WorkInternalUtilityChrome'
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
    <div className="vp-internal-page vp-internal-page--utility">
      <WorkInternalUtilityChrome navTitle="Showreel editor" showBack>
        <div className="vp-showreel-login">
          <header className="vp-showreel-login__header">
            <h1 className="vp-internal-app__title">Showreel editor</h1>
            <p className="vp-showreel-editor__hint">
              Enter the shared editor password to continue.
            </p>
          </header>
          <Suspense fallback={<div className="vp-load-spinner" />}>
            <ShowreelLoginForm />
          </Suspense>
        </div>
      </WorkInternalUtilityChrome>
    </div>
  )
}
