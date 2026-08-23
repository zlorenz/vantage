/**
 * Dialog shell for the visual in/out-point picker (Studio overlay).
 */

import {Box, Dialog, Flex, Spinner, Stack, Text} from '@sanity/ui'
import type {ReactNode} from 'react'
import {STUDIO_OVERLAY_Z} from '@studio-overlay-z'

type PreviewBoundsPickerDialogProps = {
  onClose: () => void
  children: ReactNode
  /** Shown while keyframes are loading before the picker can render. */
  loading?: boolean
}

export function PreviewBoundsPickerDialog({
  onClose,
  children,
  loading,
}: PreviewBoundsPickerDialogProps) {
  return (
    <Dialog
      id="vp-preview-bounds-picker"
      header="Set in/out points"
      width={2}
      onClose={onClose}
      zOffset={STUDIO_OVERLAY_Z + 100}
    >
      <Stack space={3} paddingX={4} paddingBottom={4} paddingTop={2}>
        {loading ? (
          <Flex align="center" gap={3} paddingY={4} justify="center">
            <Spinner muted />
            <Text size={1} muted>
              Loading keyframes...
            </Text>
          </Flex>
        ) : (
          <Box>{children}</Box>
        )}
      </Stack>
    </Dialog>
  )
}
