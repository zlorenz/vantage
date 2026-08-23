/**
 * FeaturedImageHotspotInput — stock ImageInput (upload/replace/delete) plus a
 * custom dual-aspect focal-point editor for portfolio featured images.
 *
 * Writes standard Sanity hotspot/crop so urlForImage() consumers stay unchanged.
 */

import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useRef, useState} from 'react'
import {useClient, type ObjectInputProps} from 'sanity'

type ImageFieldValue = {
  _type?: 'image'
  asset?: {_type?: 'reference'; _ref?: string}
  hotspot?: {
    _type?: string
    x?: number
    y?: number
    height?: number
    width?: number
  }
  crop?: {
    _type?: string
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
}

type AssetPreview = {
  url?: string
  metadata?: {
    dimensions?: {
      width?: number
      height?: number
      aspectRatio?: number
    }
  }
}

type GuideSpec = {
  title: string
  /** Width / height */
  aspectRatio: number
  color: string
}

/** Matches /work desktop card (4:5) and homepage carousel poster crop (16:9). */
const GUIDES: GuideSpec[] = [
  {title: 'Work Carousel (Desktop)', aspectRatio: 4 / 5, color: 'rgba(249, 219, 36, 0.95)'},
  {title: 'Homepage Carousel', aspectRatio: 16 / 9, color: 'rgba(100, 180, 255, 0.95)'},
]

const DEFAULT_CENTER = {x: 0.5, y: 0.5}

function assetIdFromValue(value: unknown): string | null {
  const ref = (value as ImageFieldValue | undefined)?.asset?._ref
  return typeof ref === 'string' && ref ? ref : null
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

/** Largest rectangle of `aspectRatio` (w/h) that fits in an image of size W×H. */
function maxGuideSize(
  imageW: number,
  imageH: number,
  aspectRatio: number,
): {width: number; height: number} {
  if (imageW <= 0 || imageH <= 0 || aspectRatio <= 0) {
    return {width: 0, height: 0}
  }
  const imageAspect = imageW / imageH
  if (imageAspect > aspectRatio) {
    // Image wider than guide — height-limited.
    return {width: imageH * aspectRatio, height: imageH}
  }
  // Image taller/narrower than guide — width-limited.
  return {width: imageW, height: imageW / aspectRatio}
}

/**
 * Position a guide so its center is as close as possible to (cx, cy) while
 * remaining fully inside the image. Returns CSS % for left/top/width/height.
 */
function guideBoxStyle(
  imageW: number,
  imageH: number,
  aspectRatio: number,
  cx: number,
  cy: number,
): {left: string; top: string; width: string; height: string} {
  const size = maxGuideSize(imageW, imageH, aspectRatio)
  const halfW = size.width / 2
  const halfH = size.height / 2
  const centerX = clamp01(cx) * imageW
  const centerY = clamp01(cy) * imageH
  const left = Math.min(Math.max(centerX - halfW, 0), imageW - size.width)
  const top = Math.min(Math.max(centerY - halfH, 0), imageH - size.height)
  return {
    left: `${(left / imageW) * 100}%`,
    top: `${(top / imageH) * 100}%`,
    width: `${(size.width / imageW) * 100}%`,
    height: `${(size.height / imageH) * 100}%`,
  }
}

export function FeaturedImageHotspotInput(props: ObjectInputProps) {
  const {value, renderDefault} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const assetId = assetIdFromValue(value)
  const imageValue = (value ?? {}) as ImageFieldValue

  const [asset, setAsset] = useState<AssetPreview | null>(null)
  /** Natural pixel size from metadata, refined by img onLoad when needed. */
  const [naturalSize, setNaturalSize] = useState<{width: number; height: number} | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const center = useMemo(() => {
    const x = imageValue.hotspot?.x
    const y = imageValue.hotspot?.y
    return {
      x: typeof x === 'number' && Number.isFinite(x) ? clamp01(x) : DEFAULT_CENTER.x,
      y: typeof y === 'number' && Number.isFinite(y) ? clamp01(y) : DEFAULT_CENTER.y,
    }
  }, [imageValue.hotspot?.x, imageValue.hotspot?.y])

  useEffect(() => {
    if (!assetId) {
      setAsset(null)
      setNaturalSize(null)
      return
    }
    let cancelled = false
    client
      .fetch<AssetPreview>(
        `*[_id == $id][0]{url, metadata{dimensions{width, height, aspectRatio}}}`,
        {id: assetId},
      )
      .then((data) => {
        if (cancelled) return
        setAsset(data ?? null)
        const w = data?.metadata?.dimensions?.width
        const h = data?.metadata?.dimensions?.height
        if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
          setNaturalSize({width: w, height: h})
        } else {
          setNaturalSize(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAsset(null)
          setNaturalSize(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [assetId, client])

  const onImageLoad = () => {
    const img = imgRef.current
    if (!img?.naturalWidth || !img.naturalHeight) return
    setNaturalSize((prev) => {
      if (prev && prev.width === img.naturalWidth && prev.height === img.naturalHeight) {
        return prev
      }
      return {width: img.naturalWidth, height: img.naturalHeight}
    })
  }

  return (
    <Stack space={3}>
      {renderDefault(props)}
      {assetId && asset?.url ? (
        <Card padding={3} radius={2} shadow={1} tone="transparent" border>
          <Stack space={3}>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Focal point
              </Text>
              <Text size={1} muted>
                Guides show how the image crops for Work (4:5) and Homepage (16:9). Drag coming
                next.
              </Text>
              <Flex gap={3} wrap="wrap">
                {GUIDES.map((guide) => (
                  <Flex key={guide.title} align="center" gap={2}>
                    <Box
                      style={{
                        width: 12,
                        height: 12,
                        border: `2px solid ${guide.color}`,
                        borderRadius: 2,
                        flexShrink: 0,
                      }}
                    />
                    <Text size={1} muted>
                      {guide.title}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Stack>

            <Box
              style={{
                position: 'relative',
                width: '100%',
                lineHeight: 0,
                userSelect: 'none',
              }}
            >
              <img
                ref={imgRef}
                src={asset.url}
                alt=""
                onLoad={onImageLoad}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                }}
              />
              {naturalSize
                ? GUIDES.map((guide) => {
                    const box = guideBoxStyle(
                      naturalSize.width,
                      naturalSize.height,
                      guide.aspectRatio,
                      center.x,
                      center.y,
                    )
                    return (
                      <Box
                        key={guide.title}
                        aria-hidden
                        style={{
                          position: 'absolute',
                          ...box,
                          border: `2px solid ${guide.color}`,
                          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.35)`,
                          pointerEvents: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    )
                  })
                : null}
              {/* Shared center crosshair */}
              {naturalSize ? (
                <Box
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: `${center.x * 100}%`,
                    top: `${center.y * 100}%`,
                    width: 10,
                    height: 10,
                    marginLeft: -5,
                    marginTop: -5,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.95)',
                    border: '2px solid rgba(0,0,0,0.75)',
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ) : null}
            </Box>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  )
}
