/**
 * next-intl proxy + app-host routing + showreel editor password gate.
 *
 * English routes have no prefix; Chinese routes are prefixed with /zh/.
 * localeDetection is disabled in routing.ts — / always serves English unless
 * the user navigates to /zh/ or uses the language switcher.
 *
 * App host (NEXT_PUBLIC_APP_HOST, default app.vantage.pictures):
 *   /              → rewrite → /work-internal
 *   /:slug         → rewrite → /work-internal/:slug
 *   /showreels (index) + /showreel/.../edit + /showreel/login stay on app
 *   everything else → redirect to marketing origin
 *
 * Marketing host:
 *   /work-internal(/:slug) → 308 → app host (prefix stripped)
 *   showreels index + showreel login + edit  → 308 → app host
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
  isShowreelIndexPath,
  showreelLoginPathFor,
} from './lib/showreel-auth-paths'
import {requestHasShowreelAuth} from './lib/showreel-auth-session'
import {
  getAppOrigin,
  getSiteOrigin,
  hostnameFromHostHeader,
  isAppHostname,
  isAppHostReservedSegment,
} from './lib/site-hosts'

const handleI18nRouting = createMiddleware(routing)

function isShowreelLoginPath(pathname: string): boolean {
  return (
    pathname === '/showreel/login' ||
    pathname.startsWith('/showreel/login/') ||
    pathname === '/zh/showreel/login' ||
    pathname.startsWith('/zh/showreel/login/')
  )
}

/** Public share page (not editor) — stays on marketing. */
function isPublicShowreelPath(pathname: string): boolean {
  return (
    /^\/showreel\/(?!login(?:\/|$))[^/]+\/?$/.test(pathname) ||
    /^\/zh\/showreel\/(?!login(?:\/|$))[^/]+\/?$/.test(pathname)
  )
}

function stripWorkInternalPrefix(pathname: string): string {
  if (pathname === '/work-internal' || pathname === '/work-internal/') return '/'
  if (pathname.startsWith('/work-internal/')) {
    const rest = pathname.slice('/work-internal'.length)
    return rest || '/'
  }
  if (pathname === '/zh/work-internal' || pathname === '/zh/work-internal/') {
    return '/'
  }
  if (pathname.startsWith('/zh/work-internal/')) {
    const rest = pathname.slice('/zh/work-internal'.length)
    return rest || '/'
  }
  return pathname
}

export default function proxy(request: NextRequest) {
  const hostname = hostnameFromHostHeader(request.headers.get('host'))
  const browserPathname = request.nextUrl.pathname
  const {search} = request.nextUrl
  const onApp = isAppHostname(hostname)

  if (!onApp) {
    if (
      browserPathname === '/work-internal' ||
      browserPathname.startsWith('/work-internal/') ||
      browserPathname === '/zh/work-internal' ||
      browserPathname.startsWith('/zh/work-internal/')
    ) {
      return NextResponse.redirect(
        new URL(stripWorkInternalPrefix(browserPathname) + search, getAppOrigin()),
        308,
      )
    }

    if (
      isShowreelIndexPath(browserPathname) ||
      isShowreelLoginPath(browserPathname) ||
      isShowreelEditPath(browserPathname)
    ) {
      const destPath = browserPathname.startsWith('/zh/')
        ? browserPathname.replace(/^\/zh/, '') || '/'
        : browserPathname
      return NextResponse.redirect(new URL(destPath + search, getAppOrigin()), 308)
    }
  } else if (isPublicShowreelPath(browserPathname)) {
    return NextResponse.redirect(
      new URL(browserPathname + search, getSiteOrigin()),
      308,
    )
  } else if (
    browserPathname === '/work-internal' ||
    browserPathname.startsWith('/work-internal/') ||
    browserPathname === '/zh/work-internal' ||
    browserPathname.startsWith('/zh/work-internal/')
  ) {
    return NextResponse.redirect(
      new URL(stripWorkInternalPrefix(browserPathname) + search, request.url),
      308,
    )
  } else if (browserPathname === '/' || browserPathname === '') {
    request.nextUrl.pathname = '/work-internal'
  } else if (
    isShowreelIndexPath(browserPathname) ||
    isShowreelLoginPath(browserPathname) ||
    isShowreelEditPath(browserPathname)
  ) {
    // Keep browser path — editor tools live on the app host.
  } else {
    const segments = browserPathname.split('/').filter(Boolean)
    if (segments.length === 1 && !isAppHostReservedSegment(segments[0]!)) {
      request.nextUrl.pathname = `/work-internal/${segments[0]}`
    } else {
      return NextResponse.redirect(
        new URL(browserPathname + search, getSiteOrigin()),
        308,
      )
    }
  }

  const response = handleI18nRouting(request)

  if (isShowreelEditPath(browserPathname) && !requestHasShowreelAuth(request)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = showreelLoginPathFor(browserPathname)
    loginUrl.search = ''
    loginUrl.searchParams.set('next', `${browserPathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon.ico|.*\\..*).*)'],
}
