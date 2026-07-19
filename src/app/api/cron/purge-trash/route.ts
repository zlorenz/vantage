/**
 * Daily cron: permanently delete Trash items whose purgeAfter has passed.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Requires SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) server-side.
 */

import {NextResponse} from 'next/server'
import {purgeExpiredTrash} from '@/lib/trash-lifecycle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  return header === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }

  try {
    const results = await purgeExpiredTrash()
    const ok = results.filter((r) => r.ok).length
    const failed = results.filter((r) => !r.ok)

    console.info('[purge-trash]', {
      total: results.length,
      ok,
      failed: failed.length,
      failures: failed.map((r) => ({id: r.publishedId, error: r.error})),
    })

    return NextResponse.json({
      success: true,
      total: results.length,
      deleted: ok,
      failed: failed.length,
      results,
    })
  } catch (error) {
    console.error('[purge-trash] failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      {status: 500},
    )
  }
}
