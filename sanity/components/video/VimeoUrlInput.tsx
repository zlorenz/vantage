/**
 * VimeoUrlInput — URL field with manual paste (renderDefault) + Vimeo library picker.
 */

import {SearchIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack} from '@sanity/ui'
import {useCallback, useState} from 'react'
import type {StringInputProps} from 'sanity'
import {set, unset} from 'sanity'

import {VimeoLibraryPicker, type VimeoLibrarySelection} from './VimeoLibraryPicker'

export function VimeoUrlInput(props: StringInputProps) {
  const {readOnly, renderDefault, onChange} = props
  const [pickerOpen, setPickerOpen] = useState(false)

  const applySelection = useCallback(
    (selection: VimeoLibrarySelection) => {
      const link = selection.link.trim()
      onChange(link ? set(link) : unset())
      setPickerOpen(false)
    },
    [onChange],
  )

  return (
    <Stack space={3}>
      {renderDefault(props)}
      <Flex gap={2} wrap="wrap">
        <Button
          mode="ghost"
          icon={SearchIcon}
          text="Browse Vimeo library"
          onClick={() => setPickerOpen(true)}
          disabled={readOnly}
        />
      </Flex>
      {pickerOpen ? (
        <Box>
          <VimeoLibraryPicker onSelect={applySelection} onClose={() => setPickerOpen(false)} />
        </Box>
      ) : null}
    </Stack>
  )
}
