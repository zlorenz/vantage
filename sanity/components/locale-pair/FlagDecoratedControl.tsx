import {Box} from '@sanity/ui'
import type {CSSProperties, ReactNode} from 'react'

import {LocaleFlag, localeAriaLabel} from './LocaleFlag'

type FlagDecoratedControlProps = {
  locale: 'en' | 'zh'
  children: ReactNode
  /** Vertical alignment of the flag chip. Use `start` for textareas. */
  align?: 'center' | 'start'
  style?: CSSProperties
  /** When true, softens the control so the editable side reads as primary. */
  readOnly?: boolean
}

/** Soften read-only controls so the editable side reads as primary. */
export const READONLY_FIELD_MUTE: CSSProperties = {
  opacity: 0.72,
}

/**
 * Positions a circular locale flag on the inner-right of a control.
 * Child should be a full-width Sanity UI TextInput / TextArea (with its own paddingRight).
 * Read-only controls are slightly transparent so the editable side stands out.
 */
export function FlagDecoratedControl(props: FlagDecoratedControlProps) {
  const align = props.align ?? 'center'
  const mute = Boolean(props.readOnly)

  return (
    <Box
      className={mute ? 'vp-locale-readonly' : undefined}
      style={{
        position: 'relative',
        ...(mute ? READONLY_FIELD_MUTE : null),
        ...props.style,
      }}
    >
      {props.children}
      <span
        aria-label={localeAriaLabel(props.locale)}
        title={localeAriaLabel(props.locale)}
        style={{
          position: 'absolute',
          right: 10,
          top: align === 'start' ? 10 : '50%',
          transform: align === 'start' ? undefined : 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        <LocaleFlag locale={props.locale} />
      </span>
    </Box>
  )
}
