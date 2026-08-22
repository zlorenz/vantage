/**
 * Carousel preview Start/End picker — keyframe timestamps from /api/vimeo-keyframes.
 * Loads only after the editor focuses the pair (not on document open / list view).
 * Falls back to number inputs when the video is not a Vimeo progressive MP4.
 *
 * Rendered as one stacked field via PreviewBoundsPairField. previewEndSeconds
 * stays in the form tree as NullField so sibling patches keep working.
 */

import {Box, Flex, Grid, Spinner, Stack, Text, TextInput} from '@sanity/ui'
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
import {
  PreviewBoundsVisualPicker,
  type PreviewBound,
} from './video/PreviewBoundsVisualPicker'

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

function PreviewBoundFallbackInput(props: {
  bound: PreviewBound
  value: number | undefined
  readOnly?: boolean
  onSelect: (bound: PreviewBound, next: string) => void
}) {
  const {bound, value, readOnly, onSelect} = props

  return (
    <TextInput
      type="number"
      fontSize={1}
      padding={3}
      radius={1}
      min={0}
      step="any"
      placeholder={bound === 'start' ? 'Play from start' : 'Play to end'}
      value={typeof value === 'number' ? String(value) : ''}
      readOnly={readOnly}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onSelect(bound, event.currentTarget.value)
      }}
    />
  )
}

type PairInnerProps = {
  videoId: string | null
  readOnly: boolean
  startSeconds: number | undefined
  endSeconds: number | undefined
  documentId: string
  title: ReactNode
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
    title,
    description,
    errors,
    startOnChange,
    patch,
  } = props

  const [status, setStatus] = useState<LoadStatus>(videoId ? 'idle' : 'fallback')
  const [keyframes, setKeyframes] = useState<number[]>([])
  const [mintFailed, setMintFailed] = useState(false)

  const beginLoad = useCallback(() => {
    if (status !== 'idle' || readOnly) return
    if (!videoId) {
      setStatus('fallback')
      return
    }
    setMintFailed(false)
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

  const handleSelect = useCallback(
    (bound: PreviewBound, next: string) => {
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

  const showFallbackInputs = status === 'fallback' || mintFailed

  return (
    <Box paddingY={1}>
      <Stack space={3} onPointerDown={beginLoad} onFocusCapture={beginLoad}>
        <FieldLabel optional size={1}>
          {title}
        </FieldLabel>
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
        ) : null}

        {status === 'ready' && videoId && !showFallbackInputs ? (
          <PreviewBoundsVisualPicker
            videoId={videoId}
            keyframes={keyframes}
            startSeconds={startSeconds}
            endSeconds={endSeconds}
            readOnly={readOnly}
            onSelect={handleSelect}
            onMintError={() => setMintFailed(true)}
          />
        ) : null}

        {showFallbackInputs ? (
          <Stack space={2}>
            {status === 'ready' && mintFailed ? (
              <Text size={1} muted>
                Preview video unavailable — set bounds manually (seconds).
              </Text>
            ) : null}
            <Grid columns={2} gap={2}>
              <Stack space={2}>
                <FieldLabel optional size={1}>
                  Start
                </FieldLabel>
                <PreviewBoundFallbackInput
                  bound="start"
                  value={startSeconds}
                  readOnly={readOnly}
                  onSelect={handleSelect}
                />
              </Stack>
              <Stack space={2}>
                <FieldLabel optional size={1}>
                  End
                </FieldLabel>
                <PreviewBoundFallbackInput
                  bound="end"
                  value={endSeconds}
                  readOnly={readOnly}
                  onSelect={handleSelect}
                />
              </Stack>
            </Grid>
          </Stack>
        ) : null}

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
      title={props.title || 'In and Out Points'}
      description={props.description as ReactNode}
      errors={errors}
      startOnChange={startOnChange}
      patch={patch}
    />
  )
}
