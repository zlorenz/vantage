/**
 * VideoEmbedBlock — PT video preview with title (oEmbed), edit + delete.
 */

import {EditIcon, PlayIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useClient, type BlockProps} from 'sanity'
import {STUDIO_OVERLAY_Z} from '@studio-overlay-z'
import {parseVideoUrl, vimeoThumbnailUrl, youTubePosterUrl} from '@video-url'

import {resolveVideoTitle} from './resolveVideoTitle'
import {VideoEmbedEditDialog} from './VideoEmbedEditDialog'
import {preserveBodyFocusScroll, preventFocusSteal} from './preserveBodyScroll'

type VideoEmbedValue = {
  _type?: string
  _key?: string
  url?: string
  title?: string
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function VideoEmbedBlock(props: BlockProps) {
  const {value, focused, selected, readOnly, path} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const block = (value ?? {}) as VideoEmbedValue
  const url = asString(block.url)
  const storedTitle = asString(block.title)
  const parsed = url ? parseVideoUrl(url) : null

  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null)
  const oEmbedForUrl = useRef<string | null>(null)

  const provider = parsed
    ? parsed.provider === 'vimeo'
      ? 'Vimeo'
      : 'YouTube'
    : null

  const thumb =
    parsed?.provider === 'vimeo'
      ? vimeoThumbnailUrl(parsed.id)
      : parsed?.provider === 'youtube'
        ? youTubePosterUrl(parsed.id, 'hq')
        : null

  const displayTitle =
    storedTitle || resolvedTitle || (provider ? `${provider} video` : 'Video')

  // Resolve title for preview only — never auto-patch the document.
  // Writing on mount created sticky "Edited" drafts (and raced Discard → form crash).
  useEffect(() => {
    if (!url || storedTitle) {
      setResolvedTitle(null)
      return
    }
    if (!parseVideoUrl(url)) return
    if (oEmbedForUrl.current === url) return
    oEmbedForUrl.current = url

    let cancelled = false
    resolveVideoTitle(client, url).then((title) => {
      if (cancelled || !title) return
      setResolvedTitle(title)
    })
    return () => {
      cancelled = true
    }
  }, [client, storedTitle, url])

  const openEdit = useCallback(() => {
    if (readOnly) return
    preserveBodyFocusScroll(() => setEditOpen(true))
  }, [readOnly])

  const closeEdit = useCallback(() => {
    preserveBodyFocusScroll(() => setEditOpen(false))
  }, [])

  const openDelete = useCallback(() => {
    if (readOnly) return
    preserveBodyFocusScroll(() => setConfirmDelete(true))
  }, [readOnly])

  const closeDelete = useCallback(() => {
    preserveBodyFocusScroll(() => setConfirmDelete(false))
  }, [])

  const removeBlock = useCallback(() => {
    preserveBodyFocusScroll(() => {
      setConfirmDelete(false)
      props.onRemove()
    })
  }, [props])

  return (
    <>
      <div
        className="vp-body-media-block vp-body-video-block"
        data-focused={focused ? 'true' : undefined}
        data-selected={selected ? 'true' : undefined}
      >
        <Flex align="center" gap={3} padding={3}>
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
            {thumb ? (
              <img
                src={thumb}
                alt=""
                style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
              />
            ) : (
              <Flex align="center" justify="center" style={{width: '100%', height: '100%'}}>
                <PlayIcon />
              </Flex>
            )}
          </Box>
          <Box flex={1} style={{minWidth: 0}}>
            <Text size={1} weight="semibold" textOverflow="ellipsis">
              {displayTitle}
            </Text>
            <Box marginTop={2}>
              <Text size={1} muted textOverflow="ellipsis">
                {provider || 'Paste a Vimeo or YouTube URL'}
              </Text>
            </Box>
          </Box>
        </Flex>

        {!readOnly ? (
          <div className="vp-body-media-actions">
            <Button
              icon={EditIcon}
              mode="ghost"
              tone="default"
              fontSize={1}
              padding={2}
              style={{background: 'var(--card-bg-color)'}}
              aria-label="Edit video embed"
              onMouseDown={preventFocusSteal}
              onClick={openEdit}
            />
            <Button
              icon={TrashIcon}
              mode="ghost"
              tone="critical"
              fontSize={1}
              padding={2}
              style={{background: 'var(--card-bg-color)'}}
              aria-label="Remove video embed"
              onMouseDown={preventFocusSteal}
              onClick={openDelete}
            />
          </div>
        ) : null}
      </div>

      {editOpen ? (
        <VideoEmbedEditDialog
          blockPath={path}
          initialUrl={url || ''}
          initialTitle={storedTitle || resolvedTitle || ''}
          onClose={closeEdit}
        />
      ) : null}

      {confirmDelete ? (
        <Dialog
          id="vp-body-video-delete"
          header="Remove video?"
          width={0}
          onClose={closeDelete}
          zOffset={STUDIO_OVERLAY_Z}
          __unstable_autoFocus={false}
          footer={
            <Box padding={3}>
              <Flex gap={2} justify="flex-end">
                <Button mode="ghost" text="Cancel" onClick={closeDelete} />
                <Button tone="critical" text="Remove" onClick={removeBlock} />
              </Flex>
            </Box>
          }
        >
          <Box padding={4}>
            <Stack space={3}>
              <Text size={1}>This removes the video embed from the body.</Text>
            </Stack>
          </Box>
        </Dialog>
      ) : null}
    </>
  )
}
