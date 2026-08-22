/**
 * EN-side Vimeo URL control for locale pairs: text input + library picker.
 */

import {SearchIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, TextInput} from '@sanity/ui'
import {useCallback, useState, type ChangeEvent} from 'react'

import {FlagDecoratedControl} from '../locale-pair/FlagDecoratedControl'
import {VimeoLibraryPicker, type VimeoLibrarySelection} from './VimeoLibraryPicker'

const INPUT_PAD: React.CSSProperties = {paddingRight: 36}

type VimeoUrlLocalePairControlProps = {
  value: string
  readOnly?: boolean
  onChange: (value: string) => void
}

export function VimeoUrlLocalePairControl({
  value,
  readOnly,
  onChange,
}: VimeoUrlLocalePairControlProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const applySelection = useCallback(
    (selection: VimeoLibrarySelection) => {
      onChange(selection.link.trim())
      setPickerOpen(false)
    },
    [onChange],
  )

  return (
    <Stack space={2}>
      <FlagDecoratedControl locale="en" align="center" readOnly={readOnly}>
        <TextInput
          value={value}
          readOnly={readOnly}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange(event.currentTarget.value)
          }}
          style={INPUT_PAD}
        />
      </FlagDecoratedControl>
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
