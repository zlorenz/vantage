/**
 * Visual in/out-point picker — minted progressive MP4, keyframe timeline, loop preview.
 * Playback/loop patterns adapted from CarouselNativeVideo (carousel-only concerns removed).
 */

import {Box, Button, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState, type FocusEvent} from 'react'

import {candidateStudioApiBaseUrls} from './studio-api-base-url'

export type PreviewBound = 'start' | 'end'

type MintStatus = 'loading' | 'ready' | 'error'

async function mintPreviewUrl(videoId: string): Promise<string | null> {
  for (const siteUrl of candidateStudioApiBaseUrls()) {
    try {
      const response = await fetch(`${siteUrl}/api/vimeo-preview/${videoId}`)
      const body = (await response.json()) as {url?: string}
      if (response.ok && typeof body.url === 'string' && body.url.startsWith('http')) {
        return body.url
      }
    } catch {
      // Try the next local origin (Studio DEV often points at :3000, Next at :3001).
    }
  }
  return null
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—'
  return `${seconds.toFixed(2)}s`
}

function percentAlong(duration: number, time: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return Math.min(100, Math.max(0, (time / duration) * 100))
}

/** Coded aspect as a CSS `width / height` expression, or null before metadata. */
function previewAspectValue(video: HTMLVideoElement): string | null {
  const width = video.videoWidth
  const height = video.videoHeight
  if (width <= 0 || height <= 0) return null
  return `${width} / ${height}`
}

const DEFAULT_VIDEO_ASPECT = '16 / 9'

type PreviewBoundsVisualPickerProps = {
  videoId: string
  keyframes: number[]
  startSeconds: number | undefined
  endSeconds: number | undefined
  readOnly?: boolean
  onSelect: (bound: PreviewBound, next: string) => void
  onMintError?: () => void
}

export function PreviewBoundsVisualPicker({
  videoId,
  keyframes,
  startSeconds,
  endSeconds,
  readOnly,
  onSelect,
  onMintError,
}: PreviewBoundsVisualPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const startRef = useRef(startSeconds)
  const endRef = useRef(endSeconds)
  const focusedWithinRef = useRef(false)

  const [mintStatus, setMintStatus] = useState<MintStatus>('loading')
  const [src, setSrc] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [videoAspect, setVideoAspect] = useState(DEFAULT_VIDEO_ASPECT)
  const [playhead, setPlayhead] = useState(0)
  const [loopPreview, setLoopPreview] = useState(false)

  const boundedLoop =
    loopPreview && startSeconds != null && endSeconds != null && endSeconds > startSeconds

  startRef.current = startSeconds
  endRef.current = endSeconds

  useEffect(() => {
    const controller = new AbortController()
    setMintStatus('loading')
    setSrc(null)
    setDuration(null)
    setVideoAspect(DEFAULT_VIDEO_ASPECT)

    void (async () => {
      const url = await mintPreviewUrl(videoId)
      if (controller.signal.aborted) return
      if (!url) {
        setMintStatus('error')
        onMintError?.()
        return
      }
      setSrc(url)
      setMintStatus('ready')
    })()

    return () => controller.abort()
  }, [videoId, onMintError])

  const applyPlayheadBound = useCallback(
    (bound: PreviewBound) => {
      const video = videoRef.current
      if (!video || readOnly) return
      onSelect(bound, String(video.currentTime))
    },
    [onSelect, readOnly],
  )

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current
    if (!video || !Number.isFinite(time)) return
    video.currentTime = time
  }, [])

  const handleFocusIn = useCallback(() => {
    focusedWithinRef.current = true
  }, [])

  const handleFocusOut = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && rootRef.current?.contains(next)) return
    focusedWithinRef.current = false
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!focusedWithinRef.current || readOnly) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const key = event.key.toLowerCase()
      if (key === 'i') {
        event.preventDefault()
        applyPlayheadBound('start')
      } else if (key === 'o') {
        event.preventDefault()
        applyPlayheadBound('end')
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [applyPlayheadBound, readOnly])

  // Bounded loop — near-verbatim from CarouselNativeVideo.tsx timeupdate wrap.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !boundedLoop) return

    const onTimeUpdate = () => {
      const end = endRef.current
      if (end == null) return
      if (video.currentTime >= end) {
        video.currentTime = startRef.current ?? 0
      }
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    return () => video.removeEventListener('timeupdate', onTimeUpdate)
  }, [src, boundedLoop])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const applyVideoMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration)
      }
      const aspect = previewAspectValue(video)
      if (aspect) setVideoAspect(aspect)
    }

    const onTimeUpdate = () => setPlayhead(video.currentTime)

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', applyVideoMetadata)
    video.addEventListener('loadeddata', applyVideoMetadata)
    applyVideoMetadata()

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', applyVideoMetadata)
      video.removeEventListener('loadeddata', applyVideoMetadata)
    }
  }, [src])

  useEffect(() => {
    if (!boundedLoop) return
    const video = videoRef.current
    if (!video || startSeconds == null) return
    video.currentTime = startSeconds
    void video.play().catch(() => {
      // Editor may need to press play after a gesture.
    })
  }, [boundedLoop, startSeconds])

  if (mintStatus === 'loading') {
    return (
      <Flex align="center" gap={3} paddingY={2}>
        <Spinner muted />
        <Text size={1} muted>
          Loading preview video...
        </Text>
      </Flex>
    )
  }

  if (mintStatus === 'error' || !src) {
    return (
      <Text size={1} muted>
        Could not load a preview video. Use the number inputs below or check the Vimeo URL.
      </Text>
    )
  }

  const timelineReady = duration != null && duration > 0
  const startPct = timelineReady && startSeconds != null ? percentAlong(duration, startSeconds) : null
  const endPct = timelineReady && endSeconds != null ? percentAlong(duration, endSeconds) : null
  const playheadPct = timelineReady ? percentAlong(duration, playhead) : 0

  return (
    <Stack
      ref={rootRef}
      space={3}
      tabIndex={-1}
      onFocusCapture={handleFocusIn}
      onBlurCapture={handleFocusOut}
    >
      <Box
        style={{
          borderRadius: 4,
          overflow: 'hidden',
          background: 'var(--card-muted-fg-color, #111)',
          width: '100%',
          aspectRatio: videoAspect,
        }}
      >
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          preload="metadata"
          style={{display: 'block', width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </Box>

      <Stack space={2}>
        <Flex align="center" justify="space-between" gap={2} wrap="wrap">
          <Text size={1} weight="medium">
            Timeline
          </Text>
          <Text size={0} muted>
            Click a tick to seek · <kbd>I</kbd> set Start · <kbd>O</kbd> set End
          </Text>
        </Flex>

        <Box
          style={{
            position: 'relative',
            height: 40,
            borderRadius: 4,
            background: 'var(--card-border-color, rgba(0,0,0,0.08))',
            cursor: timelineReady ? 'pointer' : 'default',
          }}
          aria-hidden={!timelineReady}
        >
          {timelineReady && startPct != null && endPct != null && endPct > startPct ? (
            <Box
              style={{
                position: 'absolute',
                left: `${startPct}%`,
                width: `${endPct - startPct}%`,
                top: 0,
                bottom: 0,
                background: 'rgba(34, 139, 230, 0.22)',
                pointerEvents: 'none',
              }}
            />
          ) : null}

          {timelineReady && startPct != null ? (
            <Box
              title={`Start: ${formatTime(startSeconds!)}`}
              style={{
                position: 'absolute',
                left: `${startPct}%`,
                top: 0,
                bottom: 0,
                width: 3,
                marginLeft: -1,
                background: 'var(--card-focus-ring-color, #228be6)',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          ) : null}

          {timelineReady && endPct != null ? (
            <Box
              title={`End: ${formatTime(endSeconds!)}`}
              style={{
                position: 'absolute',
                left: `${endPct}%`,
                top: 0,
                bottom: 0,
                width: 3,
                marginLeft: -1,
                background: 'var(--card-badge-critical-fg-color, #e03131)',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          ) : null}

          {timelineReady
            ? keyframes.map((time) => {
                const left = percentAlong(duration, time)
                const isStart = startSeconds != null && Math.abs(time - startSeconds) < 0.0001
                const isEnd = endSeconds != null && Math.abs(time - endSeconds) < 0.0001
                const invalidEnd = startSeconds != null && time <= startSeconds

                return (
                  <button
                    key={time}
                    type="button"
                    title={`${formatTime(time)} — click to seek`}
                    disabled={readOnly}
                    onClick={(event) => {
                      event.stopPropagation()
                      seekTo(time)
                    }}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: isStart || isEnd ? 10 : 7,
                      height: isStart || isEnd ? 10 : 7,
                      padding: 0,
                      border: 'none',
                      borderRadius: '50%',
                      background: isStart
                        ? 'var(--card-focus-ring-color, #228be6)'
                        : isEnd
                          ? 'var(--card-badge-critical-fg-color, #e03131)'
                          : 'var(--card-fg-color, #666)',
                      opacity: invalidEnd ? 0.35 : 0.85,
                      cursor: readOnly ? 'default' : 'pointer',
                      zIndex: 1,
                    }}
                  />
                )
              })
            : null}

          {timelineReady ? (
            <Box
              style={{
                position: 'absolute',
                left: `${playheadPct}%`,
                top: 2,
                bottom: 2,
                width: 2,
                marginLeft: -1,
                background: 'var(--card-fg-color, #333)',
                opacity: 0.5,
                pointerEvents: 'none',
                zIndex: 3,
              }}
            />
          ) : null}
        </Box>

        {!timelineReady ? (
          <Text size={0} muted>
            Waiting for video duration...
          </Text>
        ) : null}
      </Stack>

      <Flex gap={2} wrap="wrap" align="center">
        <Button
          text="Set Start"
          mode="ghost"
          fontSize={1}
          disabled={readOnly}
          onClick={() => applyPlayheadBound('start')}
        />
        <Button
          text="Set End"
          mode="ghost"
          fontSize={1}
          disabled={readOnly}
          onClick={() => applyPlayheadBound('end')}
        />
        <Button
          text={loopPreview ? 'Stop loop preview' : 'Preview loop'}
          mode={loopPreview ? 'default' : 'ghost'}
          tone="primary"
          fontSize={1}
          disabled={
            readOnly ||
            startSeconds == null ||
            endSeconds == null ||
            endSeconds <= startSeconds
          }
          onClick={() => setLoopPreview((on) => !on)}
        />
      </Flex>

      <Flex gap={3} wrap="wrap">
        <Text size={1}>
          Start:{' '}
          {startSeconds != null ? (
            <>
              <strong>{formatTime(startSeconds)}</strong>{' '}
              {!readOnly ? (
                <Button
                  text="Clear"
                  mode="bleed"
                  fontSize={0}
                  padding={1}
                  onClick={() => onSelect('start', '')}
                />
              ) : null}
            </>
          ) : (
            <Text as="span" muted>
              Play from start
            </Text>
          )}
        </Text>
        <Text size={1}>
          End:{' '}
          {endSeconds != null ? (
            <>
              <strong>{formatTime(endSeconds)}</strong>{' '}
              {!readOnly ? (
                <Button
                  text="Clear"
                  mode="bleed"
                  fontSize={0}
                  padding={1}
                  onClick={() => onSelect('end', '')}
                />
              ) : null}
            </>
          ) : (
            <Text as="span" muted>
              Play to end
            </Text>
          )}
        </Text>
      </Flex>
    </Stack>
  )
}
