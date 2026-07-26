import {Box} from '@sanity/ui'
import type {CSSProperties, ReactNode} from 'react'

import {LocaleFlag, localeAriaLabel} from './LocaleFlag'

type FlagDecoratedControlProps = {
  locale: 'en' | 'zh'
  children: ReactNode
  /** Vertical alignment of the flag chip. Use `start` for textareas. */
  align?: 'center' | 'start'
  style?: CSSProperties
}

/** Soften Chinese controls so EN reads as primary in a stacked pair. */
export const ZH_FIELD_MUTE: CSSProperties = {
  opacity: 0.72,
}

/**
 * Positions a circular locale flag on the inner-right of a control.
 * Child should be a full-width Sanity UI TextInput / TextArea (with its own paddingRight).
 * Chinese locale controls are slightly transparent for EN/ZH contrast.
 */
export function FlagDecoratedControl(props: FlagDecoratedControlProps) {
  const align = props.align ?? 'center'
  const muteZh = props.locale === 'zh'

  return (
    <Box
      style={{
        position: 'relative',
        ...(muteZh ? ZH_FIELD_MUTE : null),
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
