/**
 * VideoEmbedInput — URL field + Vimeo library picker + optional title.
 */

import {SearchIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'
import {type ObjectInputProps, set, unset, useClient} from 'sanity'
import {parseVideoUrl} from '@video-url'

import {
  VimeoLibraryPicker,
  type VimeoLibrarySelection,
} from '../video/VimeoLibraryPicker'
import {resolveVideoTitle} from './resolveVideoTitle'

type VideoEmbedValue = {
  _type?: 'videoEmbed'
  url?: string
  title?: string
}

export function VideoEmbedInput(props: ObjectInputProps) {
  const {value, onChange, readOnly, renderDefault} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const [pickerOpen, setPickerOpen] = useState(false)
  const current = (value ?? {}) as VideoEmbedValue
  const parsed = current.url ? parseVideoUrl(current.url) : null
  const oEmbedForUrl = useRef<string | null>(null)

  const applySelection = useCallback(
    (selection: VimeoLibrarySelection) => {
      onChange([
        set(selection.link, ['url']),
        selection.name?.trim()
          ? set(selection.name.trim(), ['title'])
          : unset(['title']),
      ])
      setPickerOpen(false)
    },
    [onChange],
  )

  // Auto-fill title only when the URL *changes* after mount (paste / picker).
  // Skipping the initial open prevents phantom "Edited" drafts on migrated embeds.
  const urlOnMount = useRef<string | undefined>(undefined)
  useEffect(() => {
    const url = current.url?.trim() || undefined
    if (urlOnMount.current === undefined) {
      urlOnMount.current = url ?? ''
      return
    }
    if (!url || current.title?.trim() || readOnly) return
    if (url === urlOnMount.current) return
    if (!parseVideoUrl(url)) return
    if (oEmbedForUrl.current === url) return
    oEmbedForUrl.current = url
    urlOnMount.current = url

    let cancelled = false
    resolveVideoTitle(client, url).then((title) => {
      if (cancelled || !title) return
      onChange(set(title, ['title']))
    })
    return () => {
      cancelled = true
    }
  }, [client, current.title, current.url, onChange, readOnly])

  return (
    <Stack space={3}>
      {renderDefault(props)}

      <Stack space={2}>
        <Flex gap={2} wrap="wrap">
          <Button
            mode="ghost"
            icon={SearchIcon}
            text="Browse Vimeo library"
            onClick={() => setPickerOpen(true)}
            disabled={readOnly}
          />
        </Flex>
        {parsed ? (
          <Text size={1} muted>
            {parsed.provider === 'vimeo' ? 'Vimeo' : 'YouTube'}
            {current.title?.trim() ? ` · ${current.title.trim()}` : ''}
          </Text>
        ) : (
          <Text size={1} muted>
            Paste a Vimeo/YouTube URL, or pick one from the Vimeo library.
          </Text>
        )}
      </Stack>

      {pickerOpen ? (
        <Box>
          <VimeoLibraryPicker
            onSelect={applySelection}
            onClose={() => setPickerOpen(false)}
          />
        </Box>
      ) : null}
    </Stack>
  )
}
