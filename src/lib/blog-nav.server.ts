/**
 * Blog next-post nav — chronological ring loaders (server-only).
 */

import {sanityFetch} from '@/sanity/lib/live'
import {BLOG_NAV_RING_QUERY} from '@/sanity/queries/blog'
import {wrapIndex} from '@/lib/portfolio-nav'
import type {BlogPostCard} from '@/types/sanity'

export type BlogPostNavData = {
  catalogLength: number
  /** Chronological next-first slides; current post omitted. */
  slides: BlogPostCard[]
}

/**
 * Thin chronological ring for blog next-post carousel.
 * Returns null when the post is missing from the catalog or alone.
 */
export async function loadBlogPostNavData(
  currentId: string,
): Promise<BlogPostNavData | null> {
  const ringResult = await sanityFetch({
    query: BLOG_NAV_RING_QUERY,
    stega: false,
  })
  const ring = ((ringResult.data ?? []) as BlogPostCard[]).filter(
    (entry) => typeof entry.slug === 'string' && entry.slug.length > 0,
  )

  if (ring.length < 2) return null

  const currentRingIndex = ring.findIndex((entry) => entry._id === currentId)
  if (currentRingIndex < 0) return null

  const slides: BlogPostCard[] = []
  for (let step = 1; step < ring.length; step++) {
    slides.push(ring[wrapIndex(currentRingIndex + step, ring.length)]!)
  }

  if (slides.length < 1) return null

  return {
    catalogLength: ring.length,
    slides,
  }
}
