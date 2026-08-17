/**
 * Form field chrome for optional schema fields: muted FieldLabel, no "(optional)" suffix.
 * Renders the default input via props.children.
 */

import {Box, Stack, Text} from '@sanity/ui'
import type {ReactNode} from 'react'
import type {FieldProps} from 'sanity'

import {FieldLabel} from './FieldLabel'

export function OptionalField(props: FieldProps) {
  const errors = (props.validation ?? [])
    .filter((marker) => marker.level === 'error')
    .map((marker) => marker.message)
    .filter(Boolean)

  return (
    <Box paddingY={1}>
      <Stack space={2}>
        <FieldLabel optional size={1}>
          {props.title || props.schemaType.title || props.name}
        </FieldLabel>
        {props.description ? (
          <div style={{opacity: 0.7, fontSize: 13, lineHeight: 1.4}}>
            {props.description as ReactNode}
          </div>
        ) : null}
        {props.children}
        {errors.length > 0 ? (
          <Text size={0} style={{color: 'var(--card-badge-critical-fg-color)'}}>
            {errors.join(' · ')}
          </Text>
        ) : null}
      </Stack>
    </Box>
  )
}
