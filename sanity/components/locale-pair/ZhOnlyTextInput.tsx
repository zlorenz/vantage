/**
 * ZhOnlyTextInput — Chinese-only text control with an in-input CN flag.
 * Used when there is no English counterpart.
 * Relies on the default field chrome for the label.
 */

import {TextArea} from '@sanity/ui'
import type {ChangeEvent} from 'react'
import {set, unset, type StringInputProps} from 'sanity'

import {FlagDecoratedControl} from './FlagDecoratedControl'

export function ZhOnlyTextInput(props: StringInputProps) {
  const {value, readOnly, onChange, elementProps, schemaType} = props
  const rows = (schemaType as {rows?: number}).rows ?? 3

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.currentTarget.value
    onChange(next.trim() ? set(next) : unset())
  }

  return (
    <FlagDecoratedControl locale="zh" align="start" readOnly={readOnly}>
      <TextArea
        {...elementProps}
        value={value ?? ''}
        readOnly={readOnly}
        rows={rows}
        onChange={handleChange}
        style={{paddingRight: 36}}
      />
    </FlagDecoratedControl>
  )
}
