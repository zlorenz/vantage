/**
 * BodyPortableTextInput — Wide inline PT + full-viewport Focus overlay.
 *
 * ## Sanity options (why this shape)
 *
 * 1. **Native PTE fullscreen** — broken in Content tool (ExpandedLayer portal).
 * 2. **Official height customization** — CSS on `[data-testid=pt-editor]`.
 * 3. **Page-builder plugins** — out of scope.
 *
 * Focus mode: our overlay scrolls (overflow-y:auto). We do NOT constrain
 * Sanity’s internal Scroller — that fight caused stuck/bobbing scroll.
 *
 * Translator ZH fields also get "Migrate from EN" (copies EN with fresh _keys).
 */

import {CloseIcon, ExpandIcon} from '@sanity/icons'
import {Button, Card, Flex, Layer, Portal, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import type {PortableTextInputProps} from 'sanity'
import {STUDIO_OVERLAY_Z} from '@studio-overlay-z'

import {MigrateFromEnButton} from './MigrateFromEnButton'

export function BodyPortableTextInput(props: PortableTextInputProps) {
  const [focusOpen, setFocusOpen] = useState(false)

  const open = useCallback(() => setFocusOpen(true), [])
  const close = useCallback(() => setFocusOpen(false), [])

  useEffect(() => {
    if (!focusOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [focusOpen, close])

  // Lock page scroll so the overlay is the only scroll surface
  useEffect(() => {
    if (!focusOpen) return
    const {overflow, overscrollBehavior} = document.body.style
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overflow = overflow
      document.body.style.overscrollBehavior = overscrollBehavior
    }
  }, [focusOpen])

  const editorProps: PortableTextInputProps = {
    ...props,
    initialActive: true,
    ...(props.readOnly ? {hideToolbar: true} : null),
  }

  const migrate = (
    <MigrateFromEnButton
      path={props.path}
      value={props.value}
      onChange={props.onChange}
      readOnly={props.readOnly}
    />
  )

  return (
    <Stack space={3} className="vp-body-pt">
      {!focusOpen ? (
        <>
          {!props.readOnly ? (
            <Flex gap={2} wrap="wrap" align="center">
              {migrate}
              <Button
                mode="ghost"
                icon={ExpandIcon}
                text="Expand editor"
                onClick={open}
                fontSize={1}
                padding={2}
              />
            </Flex>
          ) : null}
          {props.renderDefault(editorProps)}
        </>
      ) : (
        <Card padding={3} radius={2} border tone="transparent">
          <Flex align="center" justify="space-between" gap={3}>
            <Text size={1} muted>
              Editing in expanded view…
            </Text>
            <Button mode="bleed" text="Close" onClick={close} fontSize={1} padding={2} />
          </Flex>
        </Card>
      )}

      {focusOpen ? (
        <Portal>
          <Layer zOffset={STUDIO_OVERLAY_Z}>
            <Card
              className="vp-body-focus-overlay"
              tone="default"
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: STUDIO_OVERLAY_Z,
              }}
            >
              <Flex
                align="center"
                justify="space-between"
                gap={3}
                padding={3}
                paddingX={4}
                style={{
                  flexShrink: 0,
                  borderBottom: '1px solid var(--card-border-color)',
                }}
              >
                <Flex align="center" gap={2} wrap="wrap">
                  <Text size={1} weight="semibold">
                    Compose
                  </Text>
                  {migrate}
                </Flex>
                <Button
                  icon={CloseIcon}
                  text="Close"
                  mode="ghost"
                  tone="primary"
                  onClick={close}
                />
              </Flex>

              {/* This div is the scroll container — PTE content grows inside it */}
              <div className="vp-body-pt vp-body-pt-focus">
                {props.renderDefault(editorProps)}
              </div>
            </Card>
          </Layer>
        </Portal>
      ) : null}
    </Stack>
  )
}
