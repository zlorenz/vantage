/**
 * Sanity GROQ webhook → on-demand Next.js revalidation.
 *
 * Trash/restore and other Content Lake patches do not go through Studio
 * Publish, so SanityLive alone is not enough when no browser is connected.
 * This route is hit by a manage.sanity.io webhook (signed) and calls
 * revalidatePath for the affected public surfaces.
 *
 * Auth: sanity-webhook-signature via parseBody (next-sanity/webhook).
 * Secret: SANITY_REVALIDATE_SECRET (server-only).
 */

import {revalidatePath} from 'next/cache'
import {type NextRequest, NextResponse} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

import {
  pathsForWebhookBody,
  type RevalidateWebhookBody,
} from '@/lib/revalidate-paths'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    console.error('[revalidate] SANITY_REVALIDATE_SECRET is not set')
    return NextResponse.json(
      {error: 'SANITY_REVALIDATE_SECRET is not configured'},
      {status: 500},
    )
  }

  try {
    // Third arg omitted → installed parseBody defaults wait=true (3s CDN settle).
    const {isValidSignature, body} = await parseBody<RevalidateWebhookBody>(
      request,
      secret,
    )

    if (!isValidSignature) {
      console.error('[revalidate] invalid or missing signature', {
        isValidSignature,
      })
      return NextResponse.json({error: 'Invalid signature'}, {status: 401})
    }

    if (!body?._type) {
      console.error('[revalidate] missing _type', {body})
      return NextResponse.json({error: 'Missing _type'}, {status: 400})
    }

    const paths = pathsForWebhookBody(body)
    for (const path of paths) {
      revalidatePath(path)
    }

    console.info('[revalidate]', {
      _type: body._type,
      _id: body._id,
      slug: body.slug,
      slugZh: body.slugZh,
      paths,
    })

    return NextResponse.json({
      success: true,
      _type: body._type,
      _id: body._id,
      revalidated: paths,
    })
  } catch (error) {
    console.error('[revalidate] failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      {status: 500},
    )
  }
}
