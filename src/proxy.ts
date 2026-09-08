/**
 * next-intl proxy + showreel editor password gate.
 *
 * English routes have no prefix; Chinese routes are prefixed with /zh/.
 * localeDetection is disabled in routing.ts — / always serves English unless
 * the user navigates to /zh/ or uses the language switcher.
 *
 * Showreel edit pages are gated AFTER next-intl runs. API routes are excluded
 * from this matcher — mutating showreel endpoints must call
 * `requireShowreelAuth(request)` themselves.
 */

import createMiddleware from 'next-intl/middleware'
import {NextResponse, type NextRequest} from 'next/server'
import {routing} from './i18n/routing'
import {
  isShowreelEditPath,
  showreelLoginPathFor,
} from './lib/showreel-auth-paths'
import {requestHasShowreelAuth} from './lib/showreel-auth-session'

const handleI18nRouting = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  const response = handleI18nRouting(request)

  const {pathname, search} = request.nextUrl
  if (isShowreelEditPath(pathname) && !requestHasShowreelAuth(request)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = showreelLoginPathFor(pathname)
    loginUrl.search = ''
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon.ico|.*\\..*).*)'],
}
