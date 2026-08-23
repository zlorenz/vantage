/**
 * FeaturedImageHotspotInput — stock ImageInput (upload/replace/delete) plus a
 * custom dual-aspect focal-point editor for portfolio featured images.
 *
 * Writes standard Sanity hotspot/crop so urlForImage() consumers stay unchanged.
 */

import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {set, useClient, type ObjectInputProps} from 'sanity'

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

type Center = {x: number; y: number}

/** Matches /work desktop card (4:5) and homepage carousel poster crop (16:9). */
const GUIDES: GuideSpec[] = [
  {title: 'Work Carousel (Desktop)', aspectRatio: 4 / 5, color: 'rgba(249, 219, 36, 0.95)'},
  {title: 'Homepage Carousel', aspectRatio: 16 / 9, color: 'rgba(100, 180, 255, 0.95)'},
]

const DEFAULT_CENTER: Center = {x: 0.5, y: 0.5}

const DEFAULT_CROP = {
  _type: 'sanity.imageCrop' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}

function assetIdFromValue(value: unknown): string | null {
  const ref = (value as ImageFieldValue | undefined)?.asset?._ref
  return typeof ref === 'string' && ref ? ref : null
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function centerFromHotspot(hotspot: ImageFieldValue['hotspot']): Center {
  const x = hotspot?.x
  const y = hotspot?.y
  return {
    x: typeof x === 'number' && Number.isFinite(x) ? clamp01(x) : DEFAULT_CENTER.x,
    y: typeof y === 'number' && Number.isFinite(y) ? clamp01(y) : DEFAULT_CENTER.y,
  }
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
    return {width: imageH * aspectRatio, height: imageH}
  }
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

function hotspotValue(center: Center) {
  return {
    _type: 'sanity.imageHotspot' as const,
    x: clamp01(center.x),
    y: clamp01(center.y),
    height: 1,
    width: 1,
  }
}

export function FeaturedImageHotspotInput(props: ObjectInputProps) {
  const {value, readOnly, renderDefault, onChange} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const assetId = assetIdFromValue(value)
  const imageValue = (value ?? {}) as ImageFieldValue

  const [asset, setAsset] = useState<AssetPreview | null>(null)
  /** Natural pixel size from metadata, refined by img onLoad when needed. */
  const [naturalSize, setNaturalSize] = useState<{width: number; height: number} | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const draftCenterRef = useRef<Center | null>(null)

  const storedCenter = useMemo(
    () => centerFromHotspot(imageValue.hotspot),
    [imageValue.hotspot],
  )

  /** Live center while dragging; falls back to saved hotspot. */
  const [draftCenter, setDraftCenter] = useState<Center | null>(null)
  const center = draftCenter ?? storedCenter

  const updateDraftCenter = useCallback((next: Center) => {
    draftCenterRef.current = next
    setDraftCenter(next)
  }, [])

  useEffect(() => {
    // Drop stale draft when the form value changes from outside (undo, remote).
    if (!draggingRef.current) {
      draftCenterRef.current = null
      setDraftCenter(null)
    }
  }, [storedCenter.x, storedCenter.y])

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

  const commitCenter = useCallback(
    (next: Center) => {
      if (readOnly) return
      const hotspot = hotspotValue(next)
      onChange([set(DEFAULT_CROP, ['crop']), set(hotspot, ['hotspot'])])
    },
    [onChange, readOnly],
  )

  const centerFromClient = useCallback((clientX: number, clientY: number): Center | null => {
    const stage = stageRef.current
    if (!stage) return null
    const rect = stage.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    }
  }, [])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (readOnly) return
      // Primary button / touch only.
      if (event.button !== 0 && event.pointerType === 'mouse') return
      event.preventDefault()
      const next = centerFromClient(event.clientX, event.clientY)
      if (!next) return
      draggingRef.current = true
      updateDraftCenter(next)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Untrusted / synthetic events may reject capture.
      }
    },
    [centerFromClient, readOnly, updateDraftCenter],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || readOnly) return
      const next = centerFromClient(event.clientX, event.clientY)
      if (next) updateDraftCenter(next)
    },
    [centerFromClient, readOnly, updateDraftCenter],
  )

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      } catch {
        // ignore
      }
      const next =
        centerFromClient(event.clientX, event.clientY) ?? draftCenterRef.current
      if (next) {
        // Keep draft until the form value catches up (avoids a one-frame snap-back).
        updateDraftCenter(next)
        commitCenter(next)
      }
    },
    [centerFromClient, commitCenter, updateDraftCenter],
  )

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
                Drag on the image to set the shared center for Work (4:5) and Homepage (16:9)
                crops. Guides stay on-image; the saved point can go edge-to-edge.
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
              ref={stageRef}
              style={{
                position: 'relative',
                width: '100%',
                lineHeight: 0,
                userSelect: 'none',
                cursor: readOnly ? 'default' : 'crosshair',
                touchAction: 'none',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <img
                ref={imgRef}
                src={asset.url}
                alt=""
                draggable={false}
                onLoad={onImageLoad}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  pointerEvents: 'none',
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
