/**
 * Key Visuals array chrome — slot badges from the same `@key-visuals-layout`
 * planner as the site gallery. Editors reorder to aim photos at Hero/Wide slots.
 */

import {useMemo} from 'react'
import {Badge, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {
  KEY_VISUAL_SLOT_LABEL,
  keyVisualSlotsByKey,
  type KeyVisualSlotKind,
} from '@key-visuals-layout'
import {
  useFormValue,
  type ArrayOfObjectsInputProps,
  type ObjectItem,
  type ObjectItemProps,
} from 'sanity'

const SLOT_TONE: Record<
  KeyVisualSlotKind,
  'primary' | 'positive' | 'caution' | 'default'
> = {
  hero: 'caution',
  wide: 'caution',
  pair: 'primary',
  left: 'default',
  compact: 'default',
}

function KeyVisualsSlotLegend() {
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={3}>
        <Text size={1} muted>
          Layout slots update as you reorder. Drag photos so the best frames
          land on Hero or Wide (full right column). Slots are automatic from
          order — not a manual highlight.
        </Text>
        <Flex gap={2} wrap="wrap">
          {(Object.keys(KEY_VISUAL_SLOT_LABEL) as KeyVisualSlotKind[]).map(
            (kind) => (
              <Badge key={kind} tone={SLOT_TONE[kind]} fontSize={1}>
                {KEY_VISUAL_SLOT_LABEL[kind]}
              </Badge>
            ),
          )}
        </Flex>
      </Stack>
    </Card>
  )
}

/** Array input: legend above default image list. */
export function KeyVisualsArrayInput(props: ArrayOfObjectsInputProps) {
  const {renderDefault} = props
  return (
    <Stack space={3}>
      <KeyVisualsSlotLegend />
      {renderDefault(props)}
    </Stack>
  )
}

/** Per-row badge from current `keyVisuals` order. */
export function KeyVisualsArrayItem(props: ObjectItemProps<ObjectItem>) {
  const {renderDefault, value} = props
  const keyVisuals = useFormValue(['keyVisuals']) as
    | {_key?: string}[]
    | undefined

  const slot = useMemo(() => {
    const key = typeof value?._key === 'string' ? value._key : null
    if (!key) return undefined
    return keyVisualSlotsByKey(keyVisuals).get(key)
  }, [keyVisuals, value?._key])

  return (
    <Stack space={2}>
      {slot ? (
        <Box>
          <Badge tone={SLOT_TONE[slot]} fontSize={1}>
            {KEY_VISUAL_SLOT_LABEL[slot]}
            {slot === 'hero' || slot === 'wide' ? ' · full width' : ''}
          </Badge>
        </Box>
      ) : null}
      {renderDefault(props)}
    </Stack>
  )
}
