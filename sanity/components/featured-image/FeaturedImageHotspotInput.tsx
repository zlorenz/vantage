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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import {set, useClient, type ObjectInputProps, type Path} from 'sanity'
import {STUDIO_OVERLAY_Z} from '@studio-overlay-z'
import {CAROUSEL_RATIO_LIST, ratioValue, type CarouselRatio} from '@carousel-ratios'

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

type GuideSpec = CarouselRatio

type Center = {x: number; y: number}

type GuideBox = {left: string; top: string; width: string; height: string}

type NaturalSize = {width: number; height: number}

/**
 * Layout of the stock preview <img> relative to our wrapper, including the
 * object-fit content rect (may extend outside the element for `cover`).
 */
type PreviewImgLayout = {
  /** Overlay clipped to the visible img box (wrapper-relative px). */
  overlayLeft: number
  overlayTop: number
  overlayWidth: number
  overlayHeight: number
  /** Full painted image content inside the overlay (may be negative / oversized). */
  contentLeft: number
  contentTop: number
  contentWidth: number
  contentHeight: number
}

/**
 * Guide list is the single source of truth from @carousel-ratios. Studio,
 * frontend CDN URLs, and CSS aspect-ratio all read from the same table.
 */
const GUIDES: readonly GuideSpec[] = CAROUSEL_RATIO_LIST

const GUIDE_OVERLAY = 'rgba(0, 0, 0, 0.8)'

const STOCK_PREVIEW_IMG_SELECTOR = 'img[data-testid="hotspot-image-input"]'

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

/** Resolve one axis of CSS object-position to a content offset (px). */
function objectPositionOffset(token: string | undefined, extra: number): number {
  if (!token || extra === 0) return extra / 2
  const value = token.trim()
  if (value === 'center' || value === '50%') return extra / 2
  if (value === 'left' || value === 'top') return 0
  if (value === 'right' || value === 'bottom') return extra
  if (value.endsWith('%')) {
    const pct = Number.parseFloat(value)
    return Number.isFinite(pct) ? (extra * pct) / 100 : extra / 2
  }
  if (value.endsWith('px')) {
    const px = Number.parseFloat(value)
    return Number.isFinite(px) ? px : extra / 2
  }
  return extra / 2
}

/**
 * Map natural image coords onto the stock preview <img> box, respecting object-fit.
 * Returned content offsets are relative to the img element’s border box.
 */
function measureObjectFitContent(
  img: HTMLImageElement,
  natural: NaturalSize,
): {left: number; top: number; width: number; height: number} | null {
  const elW = img.clientWidth
  const elH = img.clientHeight
  if (elW <= 0 || elH <= 0 || natural.width <= 0 || natural.height <= 0) return null

  const style = getComputedStyle(img)
  const fit = style.objectFit || 'fill'
  const posParts = (style.objectPosition || '50% 50%').trim().split(/\s+/)
  const posX = posParts[0]
  const posY = posParts[1] ?? posParts[0]

  if (fit === 'fill') {
    return {left: 0, top: 0, width: elW, height: elH}
  }

  const scale =
    fit === 'contain' || fit === 'scale-down'
      ? Math.min(elW / natural.width, elH / natural.height)
      : Math.max(elW / natural.width, elH / natural.height)

  const contentW = natural.width * scale
  const contentH = natural.height * scale
  return {
    left: objectPositionOffset(posX, elW - contentW),
    top: objectPositionOffset(posY, elH - contentH),
    width: contentW,
    height: contentH,
  }
}

function measurePreviewImgLayout(
  container: HTMLElement,
  img: HTMLImageElement,
  natural: NaturalSize,
): PreviewImgLayout | null {
  const containerRect = container.getBoundingClientRect()
  const imgRect = img.getBoundingClientRect()
  if (imgRect.width <= 0 || imgRect.height <= 0) return null

  const content = measureObjectFitContent(img, natural)
  if (!content) return null

  return {
    overlayLeft: imgRect.left - containerRect.left + container.scrollLeft,
    overlayTop: imgRect.top - containerRect.top + container.scrollTop,
    overlayWidth: imgRect.width,
    overlayHeight: imgRect.height,
    contentLeft: content.left,
    contentTop: content.top,
    contentWidth: content.width,
    contentHeight: content.height,
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

/** 1px white “+” at the geometric center of a guide (interactive editor only). */
function GuideCenterCrosshair() {
  const arm = 8
  const line: CSSProperties = {
    position: 'absolute',
    background: '#fff',
    pointerEvents: 'none',
  }

  return (
    <Box
      aria-hidden
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <Box style={{...line, left: -arm, top: 0, width: arm * 2, height: 1, transform: 'translateY(-0.5px)'}} />
      <Box style={{...line, left: 0, top: -arm, width: 1, height: arm * 2, transform: 'translateX(-0.5px)'}} />
    </Box>
  )
}

type StockPreviewGuidesProps = {
  containerRef: RefObject<HTMLElement | null>
  naturalSize: NaturalSize
  center: Center
}

/** Read-only four-guide overlay aligned to Sanity’s stock image preview. */
function StockPreviewGuides({containerRef, naturalSize, center}: StockPreviewGuidesProps) {
  const [layout, setLayout] = useState<PreviewImgLayout | null>(null)

  const syncLayout = useCallback(() => {
    const container = containerRef.current
    if (!container) {
      setLayout(null)
      return
    }
    const img = container.querySelector<HTMLImageElement>(STOCK_PREVIEW_IMG_SELECTOR)
    if (!img) {
      setLayout(null)
      return
    }
    setLayout(measurePreviewImgLayout(container, img, naturalSize))
  }, [containerRef, naturalSize])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    syncLayout()

    const img = container.querySelector<HTMLImageElement>(STOCK_PREVIEW_IMG_SELECTOR)
    const onImgLoad = () => syncLayout()
    img?.addEventListener('load', onImgLoad)

    const resizeObserver = new ResizeObserver(() => syncLayout())
    resizeObserver.observe(container)
    if (img) resizeObserver.observe(img)

    const mutationObserver = new MutationObserver(() => syncLayout())
    mutationObserver.observe(container, {childList: true, subtree: true, attributes: true})

    window.addEventListener('resize', syncLayout)

    return () => {
      img?.removeEventListener('load', onImgLoad)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', syncLayout)
    }
  }, [containerRef, syncLayout, naturalSize.width, naturalSize.height])

  if (!layout) return null

  return (
    <Box
      aria-hidden
      data-testid="featured-image-stock-preview-guides"
      style={{
        position: 'absolute',
        left: layout.overlayLeft,
        top: layout.overlayTop,
        width: layout.overlayWidth,
        height: layout.overlayHeight,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <Box
        style={{
          position: 'absolute',
          left: layout.contentLeft,
          top: layout.contentTop,
          width: layout.contentWidth,
          height: layout.contentHeight,
        }}
      >
        {GUIDES.map((guide) => {
          const box = guideBoxStyle(
            naturalSize.width,
            naturalSize.height,
            ratioValue(guide),
            center.x,
            center.y,
          )
          return (
            <Box
              key={guide.title}
              title={guide.title}
              style={{
                position: 'absolute',
                ...box,
                border: `1px solid ${guide.color}`,
                boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.35)`,
                boxSizing: 'border-box',
              }}
            />
          )
        })}
      </Box>
    </Box>
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
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null)
  const [activeGuideIndex, setActiveGuideIndex] = useState(0)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  /** Normalized pointer−center offset at drag start (guide pan — no jump on grab). */
  const panOffsetRef = useRef<Center>({x: 0, y: 0})
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

  const onStagePointerDown = useCallback(
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

  const onGuidePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (readOnly) return
      if (event.button !== 0 && event.pointerType === 'mouse') return
      event.preventDefault()
      event.stopPropagation()
      const pointer = centerFromClient(event.clientX, event.clientY)
      if (!pointer) return
      const startCenter = draftCenterRef.current ?? center
      panOffsetRef.current = {
        x: pointer.x - startCenter.x,
        y: pointer.y - startCenter.y,
      }
      draggingRef.current = true
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Untrusted / synthetic events may reject capture.
      }
    },
    [center, centerFromClient, readOnly],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || readOnly) return
      const pointer = centerFromClient(event.clientX, event.clientY)
      if (!pointer) return
      if (event.currentTarget.dataset.vpHotspotDrag === 'guide') {
        updateDraftCenter({
          x: clamp01(pointer.x - panOffsetRef.current.x),
          y: clamp01(pointer.y - panOffsetRef.current.y),
        })
        return
      }
      updateDraftCenter(pointer)
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
      const pointer = centerFromClient(event.clientX, event.clientY)
      let next: Center | null = null
      if (pointer) {
        next =
          event.currentTarget.dataset.vpHotspotDrag === 'guide'
            ? {
                x: clamp01(pointer.x - panOffsetRef.current.x),
                y: clamp01(pointer.y - panOffsetRef.current.y),
              }
            : pointer
      } else {
        next = draftCenterRef.current
      }
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
      ratioValue(activeGuide),
      displayCenter.x,
      displayCenter.y,
    )

  return (
    <Stack space={3}>
      <Text size={1} muted>
        Drag the guide to reposition without jumping, or click elsewhere on the image to
        move the focal center. Switch guides to preview each crop surface; the dimmed area
        falls outside the active guide.
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
                    border: `1px solid ${guide.color}`,
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
        onPointerDown={onStagePointerDown}
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
              data-vp-hotspot-drag="guide"
              aria-label="Drag to reposition focal guide"
              style={{
                position: 'absolute',
                ...activeGuideBox,
                border: `1px solid ${activeGuide.color}`,
                boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.35)`,
                pointerEvents: readOnly ? 'none' : 'auto',
                cursor: readOnly ? 'default' : 'grab',
                boxSizing: 'border-box',
                zIndex: 2,
                touchAction: 'none',
              }}
              onPointerDown={onGuidePointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <GuideCenterCrosshair />
            </Box>
          </>
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
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [asset, setAsset] = useState<AssetPreview | null>(null)

  const storedCenter = useMemo(
    () => centerFromHotspot(imageValue.hotspot),
    [imageValue.hotspot],
  )

  const naturalSize = useMemo((): NaturalSize | null => {
    const w = asset?.metadata?.dimensions?.width
    const h = asset?.metadata?.dimensions?.height
    if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
      return {width: w, height: h}
    }
    return null
  }, [asset])

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
      <Box ref={wrapRef} style={{position: 'relative'}}>
        {renderDefault(defaultInputProps)}
        {assetId && naturalSize ? (
          <StockPreviewGuides
            containerRef={wrapRef}
            naturalSize={naturalSize}
            center={storedCenter}
          />
        ) : null}
      </Box>
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
