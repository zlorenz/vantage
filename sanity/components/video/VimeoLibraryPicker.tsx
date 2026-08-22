/**
 * VimeoLibraryPicker — Searchable grid/list of the team's Vimeo library.
 */

import {CloseIcon, RefreshIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {STUDIO_OVERLAY_Z} from '@studio-overlay-z'

import {candidateStudioApiBaseUrls} from './studio-api-base-url'

export type VimeoLibraryVideo = {
  uri: string
  name: string
  link: string
  duration: number
  created_time: string
  privacy?: {view?: string}
  pictures?: {sizes?: Array<{width: number; height: number; link: string}>}
}

export type VimeoLibrarySelection = {
  link: string
  name: string
}

type LibraryResponse = {
  videos?: VimeoLibraryVideo[]
  total?: number
  error?: string
  message?: string
}

function pickThumbnail(
  sizes: Array<{width: number; height: number; link: string}> | undefined,
): string | null {
  if (!sizes?.length) return null
  const target = 320
  const sorted = [...sizes].sort(
    (a, b) => Math.abs(a.width - target) - Math.abs(b.width - target),
  )
  return sorted[0]?.link ?? null
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatCreated(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})
}

async function fetchLibrary(refresh: boolean): Promise<LibraryResponse> {
  const sites = candidateStudioApiBaseUrls()
  const query = refresh ? '?refresh=1' : ''
  let lastError: LibraryResponse = {
    error: 'fetch_failed',
    message: 'Could not load the Vimeo library.',
  }

  for (const siteUrl of sites) {
    try {
      const response = await fetch(`${siteUrl}/api/vimeo-library${query}`)
      const body = (await response.json()) as LibraryResponse
      if (response.status === 429 || body.error === 'rate_limited') {
        return {
          error: 'rate_limited',
          message: body.message ?? 'Vimeo rate limit reached. Try again shortly.',
        }
      }
      if (!response.ok) {
        lastError = {
          error: body.error ?? 'fetch_failed',
          message: body.message ?? 'Could not load the Vimeo library.',
        }
        continue
      }
      return body
    } catch {
      // Try the next local origin (Studio DEV often points at :3000, Next at :3001).
    }
  }

  return lastError
}

type VimeoLibraryPickerProps = {
  onSelect: (selection: VimeoLibrarySelection) => void
  onClose: () => void
}

export function VimeoLibraryPicker({onSelect, onClose}: VimeoLibraryPickerProps) {
  const [videos, setVideos] = useState<VimeoLibraryVideo[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (refresh: boolean) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const body = await fetchLibrary(refresh)
      if (body.error) {
        setError(body.message ?? 'Could not load the Vimeo library.')
        if (!refresh) setVideos(null)
        return
      }
      setVideos(Array.isArray(body.videos) ? body.videos : [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  const filtered = useMemo(() => {
    const rows = videos ?? []
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((video) => video.name.toLowerCase().includes(q))
  }, [query, videos])

  return (
    <Dialog
      id="vp-vimeo-library-picker"
      header="Browse Vimeo library"
      width={2}
      onClose={onClose}
      zOffset={STUDIO_OVERLAY_Z + 100}
    >
      <Stack space={3} padding={4}>
        <Flex gap={2} align="center" wrap="wrap">
          <Box flex={1} style={{minWidth: 200}}>
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Search video title…"
            />
          </Box>
          <Button
            mode="ghost"
            icon={RefreshIcon}
            text={refreshing ? 'Refreshing…' : 'Refresh library'}
            disabled={loading || refreshing}
            onClick={() => void load(true)}
          />
          <Button mode="bleed" icon={CloseIcon} text="Close" onClick={onClose} />
        </Flex>

        {error ? (
          <Card padding={3} tone="critical" radius={2}>
            <Text size={1}>{error}</Text>
          </Card>
        ) : null}

        {loading && !videos ? (
          <Flex align="center" gap={3} padding={4} justify="center">
            <Spinner />
            <Text size={1} muted>
              Loading Vimeo library…
            </Text>
          </Flex>
        ) : null}

        {videos ? (
          <Stack space={2} style={{maxHeight: '55vh', overflow: 'auto'}}>
            {filtered.length === 0 ? (
              <Text size={1} muted>
                No videos match.
              </Text>
            ) : (
              filtered.map((video) => {
                const thumb = pickThumbnail(video.pictures?.sizes)
                return (
                  <Card
                    key={video.uri}
                    padding={3}
                    radius={2}
                    shadow={1}
                    tone="transparent"
                    border
                    as="button"
                    style={{cursor: 'pointer', textAlign: 'left', width: '100%'}}
                    onClick={() => onSelect({link: video.link, name: video.name})}
                  >
                    <Flex gap={3} align="flex-start">
                      {thumb ? (
                        <Box
                          style={{
                            width: 120,
                            flexShrink: 0,
                            borderRadius: 4,
                            overflow: 'hidden',
                            background: 'var(--card-muted-fg-color)',
                          }}
                        >
                          <img
                            src={thumb}
                            alt=""
                            style={{display: 'block', width: '100%', height: 'auto'}}
                          />
                        </Box>
                      ) : null}
                      <Stack space={2} flex={1}>
                        <Text size={1} weight="semibold">
                          {video.name}
                        </Text>
                        <Text size={1} muted>
                          {formatDuration(video.duration)} · {formatCreated(video.created_time)}
                          {video.privacy?.view ? ` · ${video.privacy.view}` : ''}
                        </Text>
                      </Stack>
                    </Flex>
                  </Card>
                )
              })
            )}
          </Stack>
        ) : null}
      </Stack>
    </Dialog>
  )
}
