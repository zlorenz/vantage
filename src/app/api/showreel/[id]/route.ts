/**
 * PATCH /api/showreel/[id] — update title, description, and/or ordered portfolio items.
 * DELETE /api/showreel/[id] — hard-delete the showreel document (no trash).
 *
 * PATCH body (at least one field):
 *   { title?: string, description?: string | null, portfolioItemIds?: string[] }
 *
 * portfolioItemIds is a full ordered replacement (min 1). Same portfolioEntry
 * existence checks as POST /api/showreel.
 */

import {NextResponse, type NextRequest} from 'next/server'
import {requireShowreelAuth} from '@/lib/showreel-auth'
import {getSanityWriteClient} from '@/lib/sanity-write-client'
import {
  asTrimmedString,
  existingPortfolioEntryIds,
  parsePortfolioItemIds,
  portfolioItemRefsFromIds,
  uniquePortfolioItemIds,
} from '@/lib/showreel-portfolio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PatchBody = {
  title?: unknown
  description?: unknown
  portfolioItemIds?: unknown
}

type RouteContext = {
  params: Promise<{id: string}>
}

async function resolveShowreelId(
  rawId: string | undefined,
): Promise<
  | {ok: true; id: string}
  | {ok: false; response: NextResponse}
> {
  const id = typeof rawId === 'string' ? rawId.trim() : ''
  if (!id) {
    return {
      ok: false,
      response: NextResponse.json({error: 'Missing showreel id'}, {status: 400}),
    }
  }
  return {ok: true, id}
}

async function fetchExistingShowreelId(
  id: string,
): Promise<
  | {ok: true; id: string}
  | {ok: false; response: NextResponse}
> {
  const client = getSanityWriteClient()
  try {
    const exists = await client.fetch<string | null>(
      `*[_type == "showreel" && _id == $id && !(_id in path("drafts.**"))][0]._id`,
      {id},
    )
    if (!exists) {
      return {
        ok: false,
        response: NextResponse.json(
          {error: 'Showreel not found'},
          {status: 404},
        ),
      }
    }
    return {ok: true, id: exists}
  } catch (err) {
    console.error('[showreel] lookup failed:', err)
    return {
      ok: false,
      response: NextResponse.json(
        {error: 'Failed to load showreel'},
        {status: 500},
      ),
    }
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = requireShowreelAuth(request)
  if (unauthorized) return unauthorized

  const {id: rawId} = await context.params
  const resolved = await resolveShowreelId(rawId)
  if (!resolved.ok) return resolved.response
  const {id} = resolved

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json({error: 'Invalid JSON body'}, {status: 400})
  }

  const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title')
  const hasDescription = Object.prototype.hasOwnProperty.call(
    body,
    'description',
  )
  const hasItems = Object.prototype.hasOwnProperty.call(
    body,
    'portfolioItemIds',
  )

  if (!hasTitle && !hasDescription && !hasItems) {
    return NextResponse.json(
      {error: 'Provide title, description, and/or portfolioItemIds'},
      {status: 400},
    )
  }

  let title: string | undefined
  if (hasTitle) {
    title = asTrimmedString(body.title)
    if (!title) {
      return NextResponse.json({error: 'title cannot be empty'}, {status: 400})
    }
  }

  let description: string | null | undefined
  if (hasDescription) {
    if (body.description === null) {
      description = null
    } else {
      description = asTrimmedString(body.description) || null
    }
  }

  let portfolioItemIds: string[] | undefined
  if (hasItems) {
    const parsed = parsePortfolioItemIds(body.portfolioItemIds)
    if (!parsed || parsed.length === 0) {
      return NextResponse.json(
        {
          error:
            'portfolioItemIds must be a non-empty array of strings (min 1 item)',
        },
        {status: 400},
      )
    }
    portfolioItemIds = uniquePortfolioItemIds(parsed)
    if (portfolioItemIds.length === 0) {
      return NextResponse.json(
        {error: 'portfolioItemIds must include at least one item'},
        {status: 400},
      )
    }

    let foundIds: Set<string>
    try {
      foundIds = await existingPortfolioEntryIds(portfolioItemIds)
    } catch (err) {
      console.error('[showreel] portfolio id lookup failed:', err)
      return NextResponse.json(
        {error: 'Failed to validate portfolio items'},
        {status: 500},
      )
    }

    const missing = portfolioItemIds.filter((itemId) => !foundIds.has(itemId))
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error:
            'One or more portfolioItemIds do not resolve to portfolio entries',
          missing,
        },
        {status: 400},
      )
    }
  }

  const existing = await fetchExistingShowreelId(id)
  if (!existing.ok) return existing.response

  const client = getSanityWriteClient()

  try {
    let patch = client.patch(id)
    if (title !== undefined) {
      patch = patch.set({title})
    }
    if (description !== undefined) {
      patch =
        description === null
          ? patch.unset(['description'])
          : patch.set({description})
    }
    if (portfolioItemIds !== undefined) {
      patch = patch.set({
        portfolioItems: portfolioItemRefsFromIds(portfolioItemIds),
      })
    }
    await patch.commit()
  } catch (err) {
    console.error('[showreel] patch failed:', err)
    return NextResponse.json(
      {error: 'Failed to update showreel'},
      {status: 500},
    )
  }

  return NextResponse.json({
    id,
    ...(title !== undefined ? {title} : {}),
    ...(description !== undefined ? {description} : {}),
    ...(portfolioItemIds !== undefined ? {portfolioItemIds} : {}),
  })
}

/** Hard-delete — showreels are disposable; no soft-trash. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = requireShowreelAuth(request)
  if (unauthorized) return unauthorized

  const {id: rawId} = await context.params
  const resolved = await resolveShowreelId(rawId)
  if (!resolved.ok) return resolved.response
  const {id} = resolved

  const existing = await fetchExistingShowreelId(id)
  if (!existing.ok) return existing.response

  try {
    const client = getSanityWriteClient()
    await client.delete(id)
  } catch (err) {
    console.error('[showreel] delete failed:', err)
    return NextResponse.json(
      {error: 'Failed to delete showreel'},
      {status: 500},
    )
  }

  return NextResponse.json({ok: true, id})
}
