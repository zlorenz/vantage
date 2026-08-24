/**
 * FeaturedImageHotspotInput — stock ImageInput (upload/replace/delete) plus a
 * custom focal-point editor opened from the image preview crop button.
 *
 * Writes standard Sanity hotspot/crop so urlForImage() consumers stay unchanged.
 */

import {Box, Button, Dialog, Flex, Stack, Text} from '@sanity/ui'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {set, useClient, type ObjectInputProps, type Path} from 'sanity'
import {STUDIO_OVERLAY_Z} from '@studio-overlay-z'

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

type GuideBox = {left: string; top: string; width: string; height: string}

/**
 * Crop aspect guides (width / height) for homepage + /work, desktop + mobile.
 * Work Mobile / Work Desktop / Homepage Mobile ratios are Zach’s direct
 * screenshot pixel measurements (authoritative — do not recalculate from CSS).
 */
const GUIDES: GuideSpec[] = [
  {title: 'Homepage Carousel (Desktop)', aspectRatio: 16 / 9, color: 'rgba(100, 180, 255, 0.95)'},
  {
    title: 'Homepage Carousel (Mobile)',
    aspectRatio: 970 / 1562,
    color: 'rgba(220, 120, 255, 0.95)',
  },
  {
    title: 'Work Carousel (Desktop)',
    aspectRatio: 520 / 673,
    color: 'rgba(249, 219, 36, 0.95)',
  },
  /**
   * Direct device measurement (Zach): W:1320 H:2388 → 1320/2388.
   * Older CSS-token estimate was ~0.512; measured ≈0.553 — left as context only,
   * not something to reconcile back to the formula.
   */
  {
    title: 'Work Carousel (Mobile)',
    aspectRatio: 1320 / 2388,
    color: 'rgba(80, 220, 160, 0.95)',
  },
]

const GUIDE_OVERLAY = 'rgba(0, 0, 0, 0.8)'

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
): GuideBox {
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

function GuideDimOverlay({box}: {box: GuideBox}) {
  const band: CSSProperties = {
    position: 'absolute',
    background: GUIDE_OVERLAY,
    pointerEvents: 'none',
  }

  return (
    <>
      <Box aria-hidden style={{...band, left: 0, top: 0, right: 0, height: box.top}} />
      <Box
        aria-hidden
        style={{
          ...band,
          left: 0,
          top: `calc(${box.top} + ${box.height})`,
          right: 0,
          bottom: 0,
        }}
      />
      <Box
        aria-hidden
        style={{...band, left: 0, top: box.top, width: box.left, height: box.height}}
      />
      <Box
        aria-hidden
        style={{
          ...band,
          left: `calc(${box.left} + ${box.width})`,
          top: box.top,
          right: 0,
          height: box.height,
        }}
      />
    </>
  )
}

type FeaturedImageHotspotEditorProps = {
  assetUrl: string
  center: Center
  readOnly?: boolean
  onCommit: (center: Center) => void
}

function FeaturedImageHotspotEditor({
  assetUrl,
  center,
  readOnly,
  onCommit,
}: FeaturedImageHotspotEditorProps) {
  const [naturalSize, setNaturalSize] = useState<{width: number; height: number} | null>(null)
  const [activeGuideIndex, setActiveGuideIndex] = useState(0)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const draftCenterRef = useRef<Center | null>(null)
  const [draftCenter, setDraftCenter] = useState<Center | null>(null)
  const displayCenter = draftCenter ?? center

  const activeGuide = GUIDES[activeGuideIndex] ?? GUIDES[0]

  const updateDraftCenter = useCallback((next: Center) => {
    draftCenterRef.current = next
    setDraftCenter(next)
  }, [])

  useEffect(() => {
    if (!draggingRef.current) {
      draftCenterRef.current = null
      setDraftCenter(null)
    }
  }, [center.x, center.y])

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
        updateDraftCenter(next)
        onCommit(next)
      }
    },
    [centerFromClient, onCommit, updateDraftCenter],
  )

  const activeGuideBox =
    naturalSize &&
    guideBoxStyle(
      naturalSize.width,
      naturalSize.height,
      activeGuide.aspectRatio,
      displayCenter.x,
      displayCenter.y,
    )

  return (
    <Stack space={3}>
      <Text size={1} muted>
        Drag on the image to set the shared focal center. Switch guides to preview each crop
        surface; the dimmed area falls outside the active guide.
      </Text>

      <Flex gap={2} wrap="wrap">
        {GUIDES.map((guide, index) => {
          const selected = index === activeGuideIndex
          return (
            <Button
              key={guide.title}
              mode={selected ? 'default' : 'ghost'}
              tone={selected ? 'primary' : 'default'}
              fontSize={1}
              padding={2}
              onClick={() => setActiveGuideIndex(index)}
            >
              <Flex align="center" gap={2}>
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    border: `2px solid ${guide.color}`,
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <Text size={1}>{guide.title}</Text>
              </Flex>
            </Button>
          )
        })}
      </Flex>

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
          src={assetUrl}
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
        {activeGuideBox ? (
          <>
            <GuideDimOverlay box={activeGuideBox} />
            <Box
              aria-hidden
              style={{
                position: 'absolute',
                ...activeGuideBox,
                border: `2px solid ${activeGuide.color}`,
                boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.35)`,
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            />
          </>
        ) : null}
        {naturalSize ? (
          <Box
            aria-hidden
            style={{
              position: 'absolute',
              left: `${displayCenter.x * 100}%`,
              top: `${displayCenter.y * 100}%`,
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              border: '2px solid rgba(0,0,0,0.75)',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              zIndex: 1,
            }}
          />
        ) : null}
      </Box>
    </Stack>
  )
}

export function FeaturedImageHotspotInput(props: ObjectInputProps) {
  const {value, readOnly, renderDefault, onChange, onPathFocus, schemaType} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const assetId = assetIdFromValue(value)
  const imageValue = (value ?? {}) as ImageFieldValue

  const [dialogOpen, setDialogOpen] = useState(false)
  const [asset, setAsset] = useState<AssetPreview | null>(null)

  const storedCenter = useMemo(
    () => centerFromHotspot(imageValue.hotspot),
    [imageValue.hotspot],
  )

  const openDialog = useCallback(() => {
    if (!assetId || readOnly) return
    setDialogOpen(true)
  }, [assetId, readOnly])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  useEffect(() => {
    if (!assetId) {
      setAsset(null)
      return
    }
    let cancelled = false
    client
      .fetch<AssetPreview>(
        `*[_id == $id][0]{url, metadata{dimensions{width, height, aspectRatio}}}`,
        {id: assetId},
      )
      .then((data) => {
        if (!cancelled) setAsset(data ?? null)
      })
      .catch(() => {
        if (!cancelled) setAsset(null)
      })
    return () => {
      cancelled = true
    }
  }, [assetId, client])

  const commitCenter = useCallback(
    (next: Center) => {
      if (readOnly) return
      const hotspot = hotspotValue(next)
      onChange([set(DEFAULT_CROP, ['crop']), set(hotspot, ['hotspot'])])
    },
    [onChange, readOnly],
  )

  /** Show stock crop button (left of ⋯ menu) without enabling native hotspot UI. */
  const defaultInputProps = useMemo(
    () => ({
      ...props,
      schemaType: {
        ...schemaType,
        options: {
          ...(schemaType.options ?? {}),
          hotspot: true,
        },
      },
      onPathFocus: (path: Path) => {
        if (Array.isArray(path) && path[0] === 'hotspot') {
          openDialog()
          return
        }
        onPathFocus(path)
      },
    }),
    [props, schemaType, onPathFocus, openDialog],
  )

  return (
    <>
      {renderDefault(defaultInputProps)}
      {dialogOpen && asset?.url ? (
        <Dialog
          id="vp-featured-image-hotspot"
          header="Focal point"
          width={2}
          onClose={closeDialog}
          zOffset={STUDIO_OVERLAY_Z + 100}
        >
          <Box paddingX={4} paddingBottom={4} paddingTop={2}>
            <FeaturedImageHotspotEditor
              assetUrl={asset.url}
              center={storedCenter}
              readOnly={readOnly}
              onCommit={commitCenter}
            />
          </Box>
        </Dialog>
      ) : null}
    </>
  )
}
