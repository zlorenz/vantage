/**
 * Preview start/end picker — keyframe timestamps from /api/vimeo-keyframes.
 * Loads only after the editor focuses the field (not on document open / list view).
 * Falls back to the default number input when the video is not a Vimeo progressive MP4.
 */

import {Flex, Select, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent} from 'react'
import {
  getPublishedId,
  set,
  unset,
  useDocumentOperation,
  useFormValue,
  type NumberInputProps,
} from 'sanity'
import {extractVimeoId, normalizeStoredVideoUrl} from '@video-url'

const DEFAULT_SITE_URL = 'https://vantage.pictures'

function getKeyframeApiBaseUrl(): string {
  const env = (import.meta as ImportMeta & {env?: Record<string, string | boolean>}).env
  const fromEnv = env?.SANITY_STUDIO_SITE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '')
  }
  if (env?.DEV) return 'http://localhost:3000'
  return DEFAULT_SITE_URL
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'fallback'

const successCache = new Map<string, number[]>()
const inflight = new Map<string, Promise<number[] | null>>()

function candidateSiteUrls(): string[] {
  const primary = getKeyframeApiBaseUrl()
  const urls = [primary]
  const env = (import.meta as ImportMeta & {env?: {DEV?: boolean}}).env
  if (env?.DEV && primary !== 'http://localhost:3001') {
    urls.push('http://localhost:3001')
  }
  return urls
}

function loadKeyframes(videoId: string): Promise<number[] | null> {
  const sites = candidateSiteUrls()
  const cacheKey = `${sites.join('|')}:${videoId}`
  const cached = successCache.get(cacheKey)
  if (cached) return Promise.resolve(cached)
  const existing = inflight.get(cacheKey)
  if (existing) return existing

  const request = (async () => {
    for (const siteUrl of sites) {
      try {
        const response = await fetch(`${siteUrl}/api/vimeo-keyframes/${videoId}`)
        const body = (await response.json()) as {keyframes?: unknown}
        const times = Array.isArray(body.keyframes)
          ? body.keyframes.filter((value): value is number => typeof value === 'number')
          : []
        if (times.length) {
          successCache.set(cacheKey, times)
          return times
        }
      } catch {
        // Try the next local origin (Studio DEV often points at :3000, Next at :3001).
      }
    }
    return null
  })().finally(() => {
    inflight.delete(cacheKey)
  })

  inflight.set(cacheKey, request)
  return request
}

function asUrl(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function formatSeconds(value: number): string {
  return `${value}s`
}

export function PreviewBoundsInput(props: NumberInputProps) {
  const {value, onChange, readOnly, path} = props
  const bound = path.at(-1) === 'previewEndSeconds' ? 'end' : 'start'
  const vimeoUrl = asUrl(useFormValue(['vimeoUrl']))
  const cleanPreviewUrl = asUrl(useFormValue(['previewCleanVimeoUrl']))
  const startValue = useFormValue(['previewStartSeconds'])
  const endValue = useFormValue(['previewEndSeconds'])
  const documentId = asUrl(useFormValue(['_id']))
  const {patch} = useDocumentOperation(getPublishedId(documentId), 'portfolioEntry')

  const videoId = useMemo(() => {
    const raw = cleanPreviewUrl || vimeoUrl
    if (!raw) return null
    return extractVimeoId(normalizeStoredVideoUrl(raw))
  }, [cleanPreviewUrl, vimeoUrl])

  const [status, setStatus] = useState<LoadStatus>(videoId ? 'idle' : 'fallback')
  const [keyframes, setKeyframes] = useState<number[]>([])
  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    if (!videoId) {
      setStatus('fallback')
      setKeyframes([])
      return
    }
    setStatus('idle')
    setKeyframes([])
  }, [videoId])

  const beginLoad = useCallback(() => {
    if (statusRef.current !== 'idle' || readOnly) return
    if (!videoId) {
      setStatus('fallback')
      return
    }
    setStatus('loading')
    loadKeyframes(videoId).then((times) => {
      if (!times?.length) {
        setStatus('fallback')
        return
      }
      setKeyframes(times)
      setStatus('ready')
    })
  }, [readOnly, videoId])

  const startSeconds = typeof startValue === 'number' ? startValue : undefined
  const options = useMemo(() => {
    const filtered =
      bound === 'end' && startSeconds != null
        ? keyframes.filter((time) => time > startSeconds)
        : keyframes
    if (typeof value === 'number' && !filtered.some((time) => time === value)) {
      return [value, ...filtered]
    }
    return filtered
  }, [bound, keyframes, startSeconds, value])

  const handleSelect = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const next = event.currentTarget.value
      if (!next) {
        onChange(unset())
        return
      }
      const parsed = Number(next)
      if (!Number.isFinite(parsed)) return
      onChange(set(parsed))
      if (
        bound === 'start' &&
        typeof endValue === 'number' &&
        parsed >= endValue &&
        documentId
      ) {
        patch.execute([{unset: ['previewEndSeconds']}])
      }
    },
    [bound, documentId, endValue, onChange, patch],
  )

  if (status === 'fallback' || !videoId) {
    return props.renderDefault(props)
  }

  if (status === 'loading') {
    return (
      <Flex align="center" gap={3} paddingY={2}>
        <Spinner muted />
        <Text size={1} muted>
          Loading keyframes...
        </Text>
      </Flex>
    )
  }

  return (
    <Stack space={2} onPointerDown={beginLoad} onFocusCapture={beginLoad}>
      <Select
        fontSize={1}
        padding={3}
        radius={1}
        value={typeof value === 'number' ? String(value) : ''}
        disabled={readOnly}
        onPointerDown={beginLoad}
        onFocus={beginLoad}
        onChange={handleSelect}
      >
        <option value="">{bound === 'start' ? 'Play from start' : 'Play to end'}</option>
        {options.map((time) => (
          <option key={time} value={String(time)}>
            {formatSeconds(time)}
            {status === 'ready' && typeof value === 'number' && time === value && !keyframes.includes(time)
              ? ' (current)'
              : ''}
          </option>
        ))}
      </Select>
    </Stack>
  )
}
