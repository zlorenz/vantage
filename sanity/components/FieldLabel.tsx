import {Text} from '@sanity/ui'
import type {ReactNode} from 'react'

type FieldLabelProps = {
  children: ReactNode
  /** Optional fields use muted label color — do not suffix labels with "(optional)". */
  optional?: boolean
  size?: 0 | 1 | 2
}

/** Consistent label for custom Studio inputs. Required = default; optional = muted. */
export function FieldLabel({children, optional = false, size = 0}: FieldLabelProps) {
  return (
    <Text size={size} weight="semibold" muted={optional}>
      {children}
    </Text>
  )
}
