/**
 * ClearableArrayInput — wraps Sanity’s default array input with a “Clear all”
 * action and a confirm dialog (used for homepage carousel / featured work).
 */

import {TrashIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  unset,
  type ArrayOfObjectsInputProps,
  type ObjectItem,
} from 'sanity'

type ClearAllOptions = {
  /** Dialog header. Defaults from the field title. */
  confirmTitle?: string
  /** Dialog body copy. */
  confirmBody?: string
}

function readClearOptions(
  schemaType: ArrayOfObjectsInputProps['schemaType'],
): ClearAllOptions {
  const options = schemaType.options as {clearAll?: ClearAllOptions} | undefined
  return options?.clearAll ?? {}
}

export function ClearableArrayInput(props: ArrayOfObjectsInputProps) {
  const {value, readOnly, renderDefault, onChange, schemaType} = props
  const [confirmOpen, setConfirmOpen] = useState(false)
  const items = Array.isArray(value) ? (value as ObjectItem[]) : []
  const count = items.length
  const clearOptions = readClearOptions(schemaType)
  const fieldTitle = schemaType.title || 'items'
  const confirmTitle = clearOptions.confirmTitle ?? `Clear ${fieldTitle}?`
  const confirmBody =
    clearOptions.confirmBody ??
    `Remove all ${count} item${count === 1 ? '' : 's'} from this draft? Changes go live only after you publish.`

  const openConfirm = useCallback(() => {
    if (readOnly || count === 0) return
    setConfirmOpen(true)
  }, [count, readOnly])

  const closeConfirm = useCallback(() => setConfirmOpen(false), [])

  const clearAll = useCallback(() => {
    onChange(unset())
    setConfirmOpen(false)
  }, [onChange])

  return (
    <Stack space={2}>
      {renderDefault(props)}

      {count > 0 && !readOnly ? (
        <Flex justify="flex-end">
          <Button
            icon={TrashIcon}
            text="Clear all"
            mode="ghost"
            tone="critical"
            fontSize={1}
            onClick={openConfirm}
          />
        </Flex>
      ) : null}

      {confirmOpen ? (
        <Dialog
          id={`clear-array-${schemaType.name}`}
          header={confirmTitle}
          width={0}
          onClose={closeConfirm}
          zOffset={1000}
          footer={
            <Box padding={3}>
              <Flex gap={2} justify="flex-end">
                <Button mode="ghost" text="Cancel" onClick={closeConfirm} />
                <Button
                  tone="critical"
                  text="Clear all"
                  icon={TrashIcon}
                  onClick={clearAll}
                />
              </Flex>
            </Box>
          }
        >
          <Box padding={4}>
            <Text size={1}>{confirmBody}</Text>
          </Box>
        </Dialog>
      ) : null}
    </Stack>
  )
}
