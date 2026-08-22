/**
 * VideoEmbedEditDialog — Edit URL / title (and pick from Vimeo library) for a PT video block.
 */

import {SearchIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {PatchEvent, set, unset, useClient, useFormCallbacks, type Path} from 'sanity'
import {STUDIO_OVERLAY_Z} from '@studio-overlay-z'
import {parseVideoUrl} from '@video-url'

import {
  VimeoLibraryPicker,
  type VimeoLibrarySelection,
} from '../video/VimeoLibraryPicker'
import {preserveBodyFocusScroll} from './preserveBodyScroll'
import {resolveVideoTitle} from './resolveVideoTitle'

type Props = {
  blockPath: Path
  initialUrl?: string
  initialTitle?: string
  onClose: () => void
}

export function VideoEmbedEditDialog({
  blockPath,
  initialUrl = '',
  initialTitle = '',
  onClose,
}: Props) {
  const {onChange} = useFormCallbacks()
  const client = useClient({apiVersion: '2025-01-01'})
  const [url, setUrl] = useState(initialUrl)
  const [title, setTitle] = useState(initialTitle)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsed = url.trim() ? parseVideoUrl(url.trim()) : null

  useEffect(() => {
    setUrl(initialUrl)
    setTitle(initialTitle)
  }, [initialTitle, initialUrl])

  const handleClose = useCallback(() => {
    preserveBodyFocusScroll(() => onClose())
  }, [onClose])

  const applySelection = useCallback((selection: VimeoLibrarySelection) => {
    setUrl(selection.link)
    setTitle(selection.name?.trim() || '')
    setPickerOpen(false)
    setError(null)
  }, [])

  const fetchTitle = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed || !parseVideoUrl(trimmed)) return
    setFetchingTitle(true)
    setError(null)
    try {
      const next = await resolveVideoTitle(client, trimmed)
      if (next) setTitle(next)
      else setError('Could not fetch a title for this URL')
    } finally {
      setFetchingTitle(false)
    }
  }, [client, url])

  // Auto-fill title when URL is set and title is empty.
  useEffect(() => {
    const trimmed = url.trim()
    if (!trimmed || title.trim() || !parseVideoUrl(trimmed)) return
    let cancelled = false
    resolveVideoTitle(client, trimmed).then((next) => {
      if (!cancelled && next) setTitle(next)
    })
    return () => {
      cancelled = true
    }
  }, [client, title, url])

  const handleSave = useCallback(() => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      setError('Video URL is required')
      return
    }
    if (!parseVideoUrl(trimmedUrl)) {
      setError('Enter a Vimeo or YouTube URL')
      return
    }
    const trimmedTitle = title.trim()
    // blockPath is document-absolute (e.g. ['body', {_key}]), but useFormCallbacks
    // is scoped under the PT field and already prefixAll(s) the field name — so
    // patches must be relative to that array ([{_key}, 'url']), not absolute.
    const relativeBlockPath = blockPath.slice(1)
    preserveBodyFocusScroll(() => {
      onChange(
        PatchEvent.from([
          set(trimmedUrl, [...relativeBlockPath, 'url']),
          trimmedTitle
            ? set(trimmedTitle, [...relativeBlockPath, 'title'])
            : unset([...relativeBlockPath, 'title']),
        ]),
      )
      onClose()
    })
  }, [blockPath, onChange, onClose, title, url])

  return (
    <>
      <Dialog
        id="vp-body-video-edit"
        header="Video embed"
        width={1}
        onClose={handleClose}
        zOffset={STUDIO_OVERLAY_Z}
        __unstable_autoFocus={false}
        footer={
          <Box padding={3}>
            <Flex gap={2} justify="flex-end">
              <Button mode="ghost" text="Cancel" onClick={handleClose} />
              <Button text="Save" tone="positive" onClick={handleSave} />
            </Flex>
          </Box>
        }
      >
        <Box padding={4}>
          <Stack space={4}>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Video URL
              </Text>
              <TextInput
                value={url}
                onChange={(e) => {
                  setUrl(e.currentTarget.value)
                  setError(null)
                }}
                placeholder="https://vimeo.com/… or YouTube URL"
              />
              {parsed ? (
                <Text size={1} muted>
                  {parsed.provider === 'vimeo' ? 'Vimeo' : 'YouTube'}
                </Text>
              ) : null}
            </Stack>

            <Stack space={2}>
              <Flex align="center" justify="space-between" gap={2}>
                <Text size={1} weight="semibold">
                  Title
                </Text>
                <Button
                  mode="bleed"
                  text={fetchingTitle ? 'Fetching…' : 'Fetch title'}
                  fontSize={1}
                  padding={2}
                  disabled={!parsed || fetchingTitle}
                  onClick={fetchTitle}
                />
              </Flex>
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                placeholder="Shown in the editor preview"
              />
            </Stack>

            <Flex gap={2} wrap="wrap">
              <Button
                mode="ghost"
                icon={SearchIcon}
                text="Browse Vimeo library"
                onClick={() => setPickerOpen(true)}
              />
            </Flex>

            {error ? (
              <Text size={1} style={{color: 'var(--card-badge-critical-fg-color)'}}>
                {error}
              </Text>
            ) : null}
          </Stack>
        </Box>
      </Dialog>

      {pickerOpen ? (
        <VimeoLibraryPicker
          onSelect={applySelection}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </>
  )
}
