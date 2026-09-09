/**
 * Lightweight showreel editor session probe (client-safe).
 *
 * Used by /work-internal before opening the create-showreel form so a missing
 * cookie redirects through login with `?next=` instead of failing mid-submit.
 */

import {NextResponse, type NextRequest} from 'next/server'
import {requestHasShowreelAuth} from '@/lib/showreel-auth-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: requestHasShowreelAuth(request),
  })
}
