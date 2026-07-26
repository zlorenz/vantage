/**
 * VideoEmbedPreview — Studio preview for videoEmbed (lists / default object chrome).
 * PT stream uses VideoEmbedBlock instead.
 */

import {PlayIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {useEffect, useState} from 'react'
import type {PreviewProps} from 'sanity'
import {fetchVideoOEmbedTitle, parseVideoUrl, vimeoThumbnailUrl, youTubePosterUrl} from '@video-url'

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function VideoEmbedPreview(props: PreviewProps) {
  const extra = props as PreviewProps & {url?: unknown}
  const rawUrl =
    asString(extra.url) ||
    (asString(props.subtitle)?.startsWith('http') ? asString(props.subtitle) : undefined)

  const parsed = rawUrl ? parseVideoUrl(rawUrl) : null
  const thumb =
    parsed?.provider === 'vimeo'
      ? vimeoThumbnailUrl(parsed.id)
      : parsed?.provider === 'youtube'
        ? youTubePosterUrl(parsed.id, 'hq')
        : null

  const provider = parsed ? (parsed.provider === 'vimeo' ? 'Vimeo' : 'YouTube') : null
  const storedTitle = asString(props.title)
  const [fetchedTitle, setFetchedTitle] = useState<string | null>(null)

  useEffect(() => {
    if (!rawUrl || storedTitle || !parseVideoUrl(rawUrl)) {
      setFetchedTitle(null)
      return
    }
    let cancelled = false
    fetchVideoOEmbedTitle(rawUrl).then((title) => {
      if (!cancelled && title) setFetchedTitle(title)
    })
    return () => {
      cancelled = true
    }
  }, [rawUrl, storedTitle])

  const title =
    storedTitle || fetchedTitle || (provider ? `${provider} video` : 'Video')
  const subtitle = provider || 'Paste a Vimeo or YouTube URL'

  const media = thumb ? (
    <img src={thumb} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  ) : (
    <Flex align="center" justify="center" style={{width: '100%', height: '100%'}}>
      <PlayIcon />
    </Flex>
  )

  return (
    <Flex align="center" gap={4} padding={3}>
      <Box
        style={{
          width: 128,
          height: 72,
          flexShrink: 0,
          borderRadius: 3,
          overflow: 'hidden',
          background: 'var(--card-muted-bg-color)',
        }}
      >
        {media}
      </Box>
      <Box flex={1} style={{minWidth: 0}}>
        <Text size={1} weight="semibold" textOverflow="ellipsis">
          {title}
        </Text>
        <Box marginTop={2}>
          <Text size={1} muted textOverflow="ellipsis">
            {subtitle}
          </Text>
        </Box>
      </Box>
    </Flex>
  )
}
