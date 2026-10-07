/**
 * Resolve About Redesign page media slots into poster / preview props.
 * Empty curated sections keep using the automatic portfolio placeholders.
 */

import {cache} from 'react'
import {urlForImage} from '@/lib/sanity'
import {sanityFetch} from '@/sanity/lib/live'
import {ABOUT_MEDIA_QUERY} from '@/sanity/queries/pages'
import type {ABOUT_MEDIA_QUERY_RESULT} from '@/sanity/sanity.types'
import {
  EMPTY_ABOUT_PREVIEW_PLAYBACK,
  resolveAboutPreviewPlayback,
} from '@/lib/about-preview-playback'

export type AboutPreviewMedia = {
  src: string
  alt: string
  previewVimeoUrl: string | null
  previewStartSeconds: number | null
  previewEndSeconds: number | null
}

export type AboutStillMedia = {
  src: string
  alt: string
}

type PreviewSlot = NonNullable<
  NonNullable<ABOUT_MEDIA_QUERY_RESULT>['specialties']
>[number]

type ImageSlot = NonNullable<
  NonNullable<ABOUT_MEDIA_QUERY_RESULT>['statementMarkers']
>[number]

type ImageSource = Parameters<typeof urlForImage>[0]

/**
 * 2x the largest CSS poster frame (tab column ~50vw; below 992px the
 * photo is full viewport width). fit max + ignoreImageParams keeps the
 * original aspect (no hotspot square crop). object-fit cover then fills
 * the frame and crops only the overflow on one axis. Video previews stay cover.
 */
export const ABOUT_PREVIEW_POSTER_SIZE = {width: 2400, height: 2400} as const

function posterUrl(image: ImageSource, width: number, height: number) {
  return urlForImage(image).width(width).height(height).fit('crop').url()
}

export function aboutPreviewPosterUrl(image: ImageSource) {
  return urlForImage(image)
    .ignoreImageParams()
    .width(ABOUT_PREVIEW_POSTER_SIZE.width)
    .height(ABOUT_PREVIEW_POSTER_SIZE.height)
    .fit('max')
    .quality(90)
    .url()
}

function pickAlt(
  locale: string,
  slot: {alt?: string | null; altZh?: string | null},
  fallback: string,
) {
  if (locale === 'zh') {
    return slot.altZh?.trim() || slot.alt?.trim() || fallback
  }
  return slot.alt?.trim() || fallback
}

export {resolveAboutPreviewPlayback}

export function resolveAboutPreviewSlot(
  slot: PreviewSlot | null | undefined,
  locale: string,
): AboutPreviewMedia | null {
  if (!slot) return null

  if (slot.mediaMode === 'staticImage') {
    if (!slot.image) return null
    return {
      src: aboutPreviewPosterUrl(slot.image),
      alt: pickAlt(locale, slot, 'About still'),
      ...EMPTY_ABOUT_PREVIEW_PLAYBACK,
    }
  }

  if (slot.mediaMode === 'customVideo') {
    if (!slot.image) return null
    const playback = resolveAboutPreviewPlayback(slot)
    if (!playback.previewVimeoUrl) return null
    return {
      src: aboutPreviewPosterUrl(slot.image),
      alt: pickAlt(locale, slot, 'Showreel still'),
      ...playback,
    }
  }

  const entry = slot.portfolioEntry
  if (!entry) return null

  const image = slot.image ?? entry.featuredImage
  if (!image) return null

  return {
    src: aboutPreviewPosterUrl(image),
    alt: pickAlt(locale, slot, entry.title?.trim() || 'Portfolio still'),
    ...resolveAboutPreviewPlayback(slot),
  }
}

export function resolveAboutImageSlot(
  slot: ImageSlot | null | undefined,
  locale: string,
  size: {width: number; height: number},
): AboutStillMedia | null {
  if (!slot) return null

  if (slot.mediaMode === 'staticImage') {
    if (!slot.image) return null
    return {
      src: posterUrl(slot.image, size.width, size.height),
      alt: pickAlt(locale, slot, 'About still'),
    }
  }

  const entry = slot.portfolioEntry
  const image = slot.image ?? entry?.featuredImage
  if (!image) return null

  return {
    src: posterUrl(image, size.width, size.height),
    alt: pickAlt(locale, slot, entry?.title?.trim() || 'Portfolio still'),
  }
}

export function resolveAboutPreviewList(
  slots: readonly (PreviewSlot | null)[] | null | undefined,
  locale: string,
  count: number,
): AboutPreviewMedia[] | null {
  if (!slots || slots.length !== count) return null
  const resolved = slots.map((slot) => resolveAboutPreviewSlot(slot, locale))
  if (resolved.some((item) => item == null)) return null
  return resolved as AboutPreviewMedia[]
}

export function resolveAboutImageList(
  slots: readonly (ImageSlot | null)[] | null | undefined,
  locale: string,
  count: number,
  size: {width: number; height: number},
): AboutStillMedia[] | null {
  if (!slots || slots.length !== count) return null
  const resolved = slots.map((slot) => resolveAboutImageSlot(slot, locale, size))
  if (resolved.some((item) => item == null)) return null
  return resolved as AboutStillMedia[]
}

export const loadAboutMedia = cache(async () => {
  const {data} = await sanityFetch({query: ABOUT_MEDIA_QUERY, stega: false})
  return data as ABOUT_MEDIA_QUERY_RESULT
})
