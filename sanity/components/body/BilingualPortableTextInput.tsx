/**
 * Thin Portable Text input wrapper — default editor + translator "Migrate from EN".
 * Used by page.body/bodyZh and siteSettings.contactModalContent* (no Focus chrome).
 */

import {Stack} from '@sanity/ui'
import type {PortableTextInputProps} from 'sanity'

import {MigrateFromEnButton} from './MigrateFromEnButton'

export function BilingualPortableTextInput(props: PortableTextInputProps) {
  const editorProps: PortableTextInputProps = {
    ...props,
    ...(props.readOnly ? {hideToolbar: true} : null),
  }

  return (
    <Stack space={3}>
      <MigrateFromEnButton
        path={props.path}
        value={props.value}
        onChange={props.onChange}
        readOnly={props.readOnly}
      />
      {props.renderDefault(editorProps)}
    </Stack>
  )
}
