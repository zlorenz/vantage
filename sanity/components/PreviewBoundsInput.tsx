/**
 * Carousel preview Start/End picker — keyframe timestamps from /api/vimeo-keyframes.
 * Loads only after the editor focuses the pair (not on document open / list view).
 * Falls back to number inputs when the video is not a Vimeo progressive MP4.
 *
 * Rendered as one stacked field via PreviewBoundsPairField. previewEndSeconds
 * stays in the form tree as NullField so sibling patches keep working.
 */

import {Box, Flex, Select, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useState, type ChangeEvent, type ReactNode} from 'react'
import {
  getPublishedId,
  set,
  unset,
  useDocumentOperation,
  useFormValue,
  type FieldProps,
} from 'sanity'
import {extractVimeoId, normalizeStoredVideoUrl} from '@video-url'

import {FieldLabel} from './FieldLabel'

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
type Bound = 'start' | 'end'

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

function PreviewBoundControl(props: {
  bound: Bound
  value: number | undefined
  options: number[]
  status: LoadStatus
  keyframes: number[]
  readOnly?: boolean
  onBeginLoad: () => void
  onSelect: (bound: Bound, next: string) => void
}) {
  const {bound, value, options, status, keyframes, readOnly, onBeginLoad, onSelect} = props

  if (status === 'fallback') {
    return (
      <TextInput
        type="number"
        fontSize={1}
        padding={3}
        radius={1}
        min={0}
        step="any"
        value={typeof value === 'number' ? String(value) : ''}
        readOnly={readOnly}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onSelect(bound, event.currentTarget.value)
        }}
      />
    )
  }

  return (
    <Select
      fontSize={1}
      padding={3}
      radius={1}
      value={typeof value === 'number' ? String(value) : ''}
      disabled={readOnly}
      onPointerDown={onBeginLoad}
      onFocus={onBeginLoad}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => {
        onSelect(bound, event.currentTarget.value)
      }}
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
  )
}

type PairInnerProps = {
  videoId: string | null
  readOnly: boolean
  startSeconds: number | undefined
  endSeconds: number | undefined
  documentId: string
  description?: ReactNode
  errors: string[]
  startOnChange?: FieldProps['inputProps']['onChange']
  patch: ReturnType<typeof useDocumentOperation>['patch']
}

function PreviewBoundsPairInner(props: PairInnerProps) {
  const {
    videoId,
    readOnly,
    startSeconds,
    endSeconds,
    documentId,
    description,
    errors,
    startOnChange,
    patch,
  } = props

  const [status, setStatus] = useState<LoadStatus>(videoId ? 'idle' : 'fallback')
  const [keyframes, setKeyframes] = useState<number[]>([])

  const beginLoad = useCallback(() => {
    if (status !== 'idle' || readOnly) return
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
  }, [readOnly, status, videoId])

  const startOptions = useMemo(() => {
    if (typeof startSeconds === 'number' && !keyframes.some((time) => time === startSeconds)) {
      return [startSeconds, ...keyframes]
    }
    return keyframes
  }, [keyframes, startSeconds])

  const endOptions = useMemo(() => {
    const filtered =
      startSeconds != null ? keyframes.filter((time) => time > startSeconds) : keyframes
    if (typeof endSeconds === 'number' && !filtered.some((time) => time === endSeconds)) {
      return [endSeconds, ...filtered]
    }
    return filtered
  }, [endSeconds, keyframes, startSeconds])

  const handleSelect = useCallback(
    (bound: Bound, next: string) => {
      if (!next) {
        if (bound === 'start') {
          startOnChange?.(unset())
        } else if (documentId) {
          patch.execute([{unset: ['previewEndSeconds']}])
        }
        return
      }
      const parsed = Number(next)
      if (!Number.isFinite(parsed)) return

      if (bound === 'start') {
        startOnChange?.(set(parsed))
        if (typeof endSeconds === 'number' && parsed >= endSeconds && documentId) {
          patch.execute([{unset: ['previewEndSeconds']}])
        }
        return
      }

      if (documentId) {
        patch.execute([{set: {previewEndSeconds: parsed}}])
      }
    },
    [documentId, endSeconds, patch, startOnChange],
  )

  const rangeError =
    endSeconds != null && startSeconds != null && endSeconds <= startSeconds
      ? 'End must be greater than Start'
      : null

  return (
    <Box paddingY={1}>
      <Stack space={2} onPointerDown={beginLoad} onFocusCapture={beginLoad}>
        {description ? (
          <div style={{opacity: 0.7, fontSize: 13, lineHeight: 1.4}}>{description}</div>
        ) : null}

        {status === 'loading' ? (
          <Flex align="center" gap={3} paddingY={2}>
            <Spinner muted />
            <Text size={1} muted>
              Loading keyframes...
            </Text>
          </Flex>
        ) : (
          <Stack space={2}>
            <Stack space={2}>
              <FieldLabel optional size={1}>
                Start
              </FieldLabel>
              <PreviewBoundControl
                bound="start"
                value={startSeconds}
                options={startOptions}
                status={status}
                keyframes={keyframes}
                readOnly={readOnly}
                onBeginLoad={beginLoad}
                onSelect={handleSelect}
              />
            </Stack>

            <Stack space={2}>
              <FieldLabel optional size={1}>
                End
              </FieldLabel>
              <PreviewBoundControl
                bound="end"
                value={endSeconds}
                options={endOptions}
                status={status}
                keyframes={keyframes}
                readOnly={readOnly}
                onBeginLoad={beginLoad}
                onSelect={handleSelect}
              />
            </Stack>
          </Stack>
        )}

        {errors.length > 0 || rangeError ? (
          <Text size={0} style={{color: 'var(--card-badge-critical-fg-color)'}}>
            {[...errors, rangeError].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </Stack>
    </Box>
  )
}

/** Stacked Start / End field for the Carousel Preview fieldset. */
export function PreviewBoundsPairField(props: FieldProps) {
  const readOnly = Boolean(props.inputProps?.readOnly)
  const startOnChange = props.inputProps?.onChange
  const vimeoUrl = asUrl(useFormValue(['vimeoUrl']))
  const cleanPreviewUrl = asUrl(useFormValue(['previewCleanVimeoUrl']))
  const startValue = useFormValue(['previewStartSeconds'])
  const endValue = useFormValue(['previewEndSeconds'])
  const documentId = asUrl(useFormValue(['_id']))
  const {patch} = useDocumentOperation(getPublishedId(documentId), 'portfolioEntry')

  const startSeconds = typeof startValue === 'number' ? startValue : undefined
  const endSeconds = typeof endValue === 'number' ? endValue : undefined

  const videoId = useMemo(() => {
    const raw = cleanPreviewUrl || vimeoUrl
    if (!raw) return null
    return extractVimeoId(normalizeStoredVideoUrl(raw))
  }, [cleanPreviewUrl, vimeoUrl])

  const errors = (props.validation ?? [])
    .filter((marker) => marker.level === 'error')
    .map((marker) => marker.message)
    .filter(Boolean)

  return (
    <PreviewBoundsPairInner
      key={videoId ?? 'none'}
      videoId={videoId}
      readOnly={readOnly}
      startSeconds={startSeconds}
      endSeconds={endSeconds}
      documentId={documentId}
      description={props.description as ReactNode}
      errors={errors}
      startOnChange={startOnChange}
      patch={patch}
    />
  )
}
