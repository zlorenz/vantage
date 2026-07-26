import {Stack, Text, TextArea, TextInput} from '@sanity/ui'
import type {ChangeEvent, ReactNode} from 'react'

import {FieldLabel} from '../FieldLabel'
import {FlagDecoratedControl} from './FlagDecoratedControl'
import {shouldShowZh} from './shouldShowZh'
import {usePhraseBookAssist} from './usePhraseBookAssist'

const INPUT_PAD: React.CSSProperties = {paddingRight: 36}

type LocalePairStackProps = {
  label: ReactNode
  optional?: boolean
  description?: ReactNode
  enValue: string
  zhValue: string
  onEnChange: (value: string) => void
  onZhChange: (value: string) => void
  readOnly?: boolean
  /** When set, renders textareas instead of single-line inputs. */
  rows?: number
  /** Match Sanity default FormFieldHeader size (1) for schema field pairs. */
  labelSize?: 0 | 1 | 2
  /** Override progressive reveal (defaults to EN or ZH non-empty). */
  showZh?: boolean
  enPlaceholder?: string
  zhPlaceholder?: string
  /**
   * Look up / teach the shared EN→ZH phrase book (default true).
   * Disable for slugs or fields that must not seed the book.
   */
  phraseBook?: boolean
}

/** Presentational EN/ZH stacked pair with one label and in-field flags. */
export function LocalePairStack(props: LocalePairStackProps) {
  const showZh = props.showZh ?? shouldShowZh(props.enValue, props.zhValue)
  const isText = typeof props.rows === 'number' && props.rows > 0
  const {fromPhraseBook, onZhBlur} = usePhraseBookAssist({
    enValue: props.enValue,
    zhValue: props.zhValue,
    onZhChange: props.onZhChange,
    readOnly: props.readOnly,
    enabled: props.phraseBook !== false,
  })

  const handleEn = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    props.onEnChange(event.currentTarget.value)
  }
  const handleZh = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    props.onZhChange(event.currentTarget.value)
  }

  return (
    <Stack space={2}>
      <FieldLabel optional={props.optional} size={props.labelSize}>
        {props.label}
      </FieldLabel>
      {props.description ? (
        <div style={{opacity: 0.7, fontSize: 13, lineHeight: 1.4}}>{props.description}</div>
      ) : null}

      <Stack space={2}>
        <FlagDecoratedControl locale="en" align={isText ? 'start' : 'center'}>
          {isText ? (
            <TextArea
              value={props.enValue}
              readOnly={props.readOnly}
              rows={props.rows}
              onChange={handleEn}
              placeholder={props.enPlaceholder}
              style={INPUT_PAD}
            />
          ) : (
            <TextInput
              value={props.enValue}
              readOnly={props.readOnly}
              onChange={handleEn}
              placeholder={props.enPlaceholder}
              style={INPUT_PAD}
            />
          )}
        </FlagDecoratedControl>

        {showZh ? (
          <Stack space={1}>
            <FlagDecoratedControl locale="zh" align={isText ? 'start' : 'center'}>
              {isText ? (
                <TextArea
                  value={props.zhValue}
                  readOnly={props.readOnly}
                  rows={props.rows}
                  onChange={handleZh}
                  onBlur={onZhBlur}
                  placeholder={props.zhPlaceholder}
                  style={INPUT_PAD}
                />
              ) : (
                <TextInput
                  value={props.zhValue}
                  readOnly={props.readOnly}
                  onChange={handleZh}
                  onBlur={onZhBlur}
                  placeholder={props.zhPlaceholder}
                  style={INPUT_PAD}
                />
              )}
            </FlagDecoratedControl>
            {fromPhraseBook ? (
              <Text size={0} muted>
                From phrase book
              </Text>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  )
}
