import {Button, Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
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
  enReadOnly?: boolean
  zhReadOnly?: boolean
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
  /** When set, shows Sanity-style Generate next to the EN control. */
  onGenerateEn?: () => void
  /** When set, shows Sanity-style Generate next to the ZH control. */
  onGenerateZh?: () => void
  generateEnDisabled?: boolean
  generateZhDisabled?: boolean
}

/** Presentational EN/ZH stacked pair with one label and in-field flags. */
export function LocalePairStack(props: LocalePairStackProps) {
  const showZh = props.showZh ?? shouldShowZh(props.enValue, props.zhValue)
  const isText = typeof props.rows === 'number' && props.rows > 0
  const {
    fromPhraseBook,
    phraseBookZh,
    canFillFromPhraseBook,
    canOverwriteFromPhraseBook,
    fillFromPhraseBook,
    overwriteFromPhraseBook,
    onZhBlur,
  } = usePhraseBookAssist({
    enValue: props.enValue,
    zhValue: props.zhValue,
    onZhChange: props.onZhChange,
    // Mutates ZH (autofill + blur upsert + fill/overwrite) — gate on the ZH lock.
    readOnly: props.zhReadOnly,
    enabled: props.phraseBook !== false,
  })

  const handleEn = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    props.onEnChange(event.currentTarget.value)
  }
  const handleZh = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    props.onZhChange(event.currentTarget.value)
  }

  const enControl = (
    <FlagDecoratedControl
      locale="en"
      align={isText ? 'start' : 'center'}
      readOnly={props.enReadOnly}
    >
      {isText ? (
        <TextArea
          value={props.enValue}
          readOnly={props.enReadOnly}
          rows={props.rows}
          onChange={handleEn}
          placeholder={props.enPlaceholder}
          style={INPUT_PAD}
        />
      ) : (
        <TextInput
          value={props.enValue}
          readOnly={props.enReadOnly}
          onChange={handleEn}
          placeholder={props.enPlaceholder}
          style={INPUT_PAD}
        />
      )}
    </FlagDecoratedControl>
  )

  const zhControl = (
    <FlagDecoratedControl
      locale="zh"
      align={isText ? 'start' : 'center'}
      readOnly={props.zhReadOnly}
    >
      {isText ? (
        <TextArea
          value={props.zhValue}
          readOnly={props.zhReadOnly}
          rows={props.rows}
          onChange={handleZh}
          onBlur={onZhBlur}
          placeholder={props.zhPlaceholder}
          style={INPUT_PAD}
        />
      ) : (
        <TextInput
          value={props.zhValue}
          readOnly={props.zhReadOnly}
          onChange={handleZh}
          onBlur={onZhBlur}
          placeholder={props.zhPlaceholder}
          style={INPUT_PAD}
        />
      )}
    </FlagDecoratedControl>
  )

  return (
    <Stack space={2}>
      <FieldLabel optional={props.optional} size={props.labelSize}>
        {props.label}
      </FieldLabel>
      {props.description ? (
        <div style={{opacity: 0.7, fontSize: 13, lineHeight: 1.4}}>{props.description}</div>
      ) : null}

      <Stack space={2}>
        {props.onGenerateEn ? (
          <Flex gap={1} align="flex-start">
            <div style={{flex: 1, minWidth: 0}}>{enControl}</div>
            <Button
              mode="ghost"
              type="button"
              text="Generate"
              disabled={props.enReadOnly || props.generateEnDisabled}
              onClick={props.onGenerateEn}
            />
          </Flex>
        ) : (
          enControl
        )}

        {showZh ? (
          <Stack space={1}>
            {props.onGenerateZh ? (
              <Flex gap={1} align="flex-start">
                <div style={{flex: 1, minWidth: 0}}>{zhControl}</div>
                <Button
                  mode="ghost"
                  type="button"
                  text="Generate"
                  disabled={props.zhReadOnly || props.generateZhDisabled}
                  onClick={props.onGenerateZh}
                />
              </Flex>
            ) : (
              zhControl
            )}
            {canFillFromPhraseBook ? (
              <Button
                text="Fill from phrase book"
                mode="bleed"
                fontSize={1}
                padding={2}
                tone="primary"
                onClick={fillFromPhraseBook}
              />
            ) : canOverwriteFromPhraseBook ? (
              <Stack space={1}>
                {phraseBookZh ? (
                  <Text size={0} muted>
                    Phrase book: {phraseBookZh}
                  </Text>
                ) : null}
                <Button
                  text="Overwrite from phrase book"
                  mode="bleed"
                  fontSize={1}
                  padding={2}
                  tone="caution"
                  onClick={overwriteFromPhraseBook}
                />
              </Stack>
            ) : fromPhraseBook ? (
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
