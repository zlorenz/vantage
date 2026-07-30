/**
 * MutedReadonlyArrayInput — visual-only wrapper for array-of-primitives fields.
 * When the field's own readOnly is true, applies the same opacity mute and
 * focus-ring suppression used by FlagDecoratedControl (.vp-locale-readonly).
 * Does not change functional readOnly behavior.
 */

import {Box} from '@sanity/ui'
import type {ArrayOfPrimitivesInputProps} from 'sanity'

import {READONLY_FIELD_MUTE} from './locale-pair/FlagDecoratedControl'

export function MutedReadonlyArrayInput(props: ArrayOfPrimitivesInputProps) {
  const {readOnly, renderDefault} = props

  if (!readOnly) {
    return renderDefault(props)
  }

  return (
    <Box className="vp-locale-readonly" style={READONLY_FIELD_MUTE}>
      {renderDefault(props)}
    </Box>
  )
}
