/**
 * Visual in/out-point picker — minted progressive MP4, keyframe timeline, loop preview.
 * Playback/loop patterns adapted from CarouselNativeVideo (carousel-only concerns removed).
 */

import {PauseIcon, PlayIcon} from '@sanity/icons'
import {Box, Button, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState, type FocusEvent, type PointerEvent} from 'react'

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

/** Playhead / duration counter — e.g. `0:03 / 0:45`. */
function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
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
const KEYFRAME_SEEK_EPS = 0.0001

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function timeFromClientX(clientX: number, track: HTMLElement, duration: number): number {
  const rect = track.getBoundingClientRect()
  if (rect.width <= 0 || duration <= 0) return 0
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
  return ratio * duration
}

/** Previous or next keyframe relative to the current playhead (strictly before/after). */
function adjacentKeyframeTime(
  times: number[],
  current: number,
  direction: 'prev' | 'next',
): number | null {
  if (!times.length) return null
  if (direction === 'next') {
    for (const time of times) {
      if (time > current + KEYFRAME_SEEK_EPS) return time
    }
    return null
  }
  for (let index = times.length - 1; index >= 0; index--) {
    const time = times[index]
    if (time < current - KEYFRAME_SEEK_EPS) return time
  }
  return null
}

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
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const startRef = useRef(startSeconds)
  const endRef = useRef(endSeconds)
  const keyframesRef = useRef(keyframes)
  const focusedWithinRef = useRef(false)

  keyframesRef.current = keyframes

  const [mintStatus, setMintStatus] = useState<MintStatus>('loading')
  const [src, setSrc] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [videoAspect, setVideoAspect] = useState(DEFAULT_VIDEO_ASPECT)
  const [playhead, setPlayhead] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
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

  const seekFromClientX = useCallback(
    (clientX: number) => {
      if (duration == null || duration <= 0) return
      const track = trackRef.current
      if (!track) return
      seekTo(timeFromClientX(clientX, track, duration))
    },
    [duration, seekTo],
  )

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play().catch(() => {
        // Editor may need to press play after a gesture.
      })
    } else {
      video.pause()
    }
  }, [])

  const onTrackPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (readOnly || duration == null || duration <= 0) return
      event.preventDefault()
      draggingRef.current = true
      seekFromClientX(event.clientX)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Untrusted / synthetic events may reject capture.
      }
    },
    [duration, readOnly, seekFromClientX],
  )

  const onTrackPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || readOnly) return
      seekFromClientX(event.clientX)
    },
    [readOnly, seekFromClientX],
  )

  const endTrackDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    } catch {
      // ignore
    }
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
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const video = videoRef.current
        const times = keyframesRef.current
        if (!video || !times.length) return
        event.preventDefault()
        const direction = event.key === 'ArrowRight' ? 'next' : 'prev'
        const target = adjacentKeyframeTime(times, video.currentTime, direction)
        if (target != null) seekTo(target)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [applyPlayheadBound, readOnly, seekTo])

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
    const syncPaused = () => setIsPaused(video.paused)

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('play', syncPaused)
    video.addEventListener('pause', syncPaused)
    video.addEventListener('loadedmetadata', applyVideoMetadata)
    video.addEventListener('loadeddata', applyVideoMetadata)
    applyVideoMetadata()
    syncPaused()

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('play', syncPaused)
      video.removeEventListener('pause', syncPaused)
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
      <Text size={1} muted>
        Scrub bar or keyframe ticks to seek · ←/→ previous/next keyframe · <kbd>I</kbd>{' '}
        set Start · <kbd>O</kbd> set End
      </Text>

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
          playsInline
          preload="metadata"
          style={{display: 'block', width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </Box>

      <Flex align="center" gap={2}>
        <Button
          mode="ghost"
          icon={isPaused ? PlayIcon : PauseIcon}
          aria-label={isPaused ? 'Play' : 'Pause'}
          disabled={readOnly || !timelineReady}
          onClick={togglePlayPause}
        />

        <Box
          ref={trackRef}
          flex={1}
          style={{
            position: 'relative',
            height: 40,
            borderRadius: 4,
            background: 'var(--card-border-color, rgba(0,0,0,0.08))',
            cursor: timelineReady && !readOnly ? 'pointer' : 'default',
            touchAction: 'none',
          }}
          aria-hidden={!timelineReady}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={endTrackDrag}
          onPointerCancel={endTrackDrag}
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
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      if (!readOnly) seekTo(time)
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
                      zIndex: 4,
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
                opacity: 0.85,
                pointerEvents: 'none',
                zIndex: 3,
              }}
            />
          ) : null}
        </Box>

        <Box
          aria-label={
            timelineReady
              ? `Playhead ${formatTimecode(playhead)} of ${formatTimecode(duration)}`
              : 'Waiting for video duration'
          }
          style={{
            flexShrink: 0,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(0, 0, 0, 0.55)',
            color: '#fff',
            fontSize: 13,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          }}
        >
          {timelineReady
            ? `${formatTimecode(playhead)} / ${formatTimecode(duration)}`
            : '— / —'}
        </Box>
      </Flex>

      {!timelineReady ? (
        <Text size={0} muted>
          Waiting for video duration...
        </Text>
      ) : null}

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

      <Flex gap={3} wrap="wrap" align="center">
        <Text size={1}>
          Start:{' '}
          {startSeconds != null ? (
            <strong>{formatTime(startSeconds)}</strong>
          ) : (
            <Text as="span" muted>
              Play from start
            </Text>
          )}
        </Text>
        <Text size={1}>
          End:{' '}
          {endSeconds != null ? (
            <strong>{formatTime(endSeconds)}</strong>
          ) : (
            <Text as="span" muted>
              Play to end
            </Text>
          )}
        </Text>
        {!readOnly && (startSeconds != null || endSeconds != null) ? (
          <Button
            text="Clear"
            mode="ghost"
            tone="critical"
            fontSize={1}
            onClick={() => {
              onSelect('start', '')
              onSelect('end', '')
            }}
          />
        ) : null}
      </Flex>
    </Stack>
  )
}
