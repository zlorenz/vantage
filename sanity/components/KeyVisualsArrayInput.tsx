/**
 * Key Visuals array chrome — slot badges from the same `@key-visuals-layout`
 * planner as the site gallery. Editors reorder to aim photos at hero slots.
 *
 * Badge lives in the list preview (inline with the filename), not above the row.
 */

import {useMemo} from 'react'
import {Badge, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {
  KEY_VISUAL_SLOT_LABEL,
  KEY_VISUAL_SLOT_LEGEND,
  keyVisualSlotsByKey,
  type KeyVisualSlotKind,
} from '@key-visuals-layout'
import {
  useFormValue,
  type ArrayOfObjectsInputProps,
  type PreviewProps,
} from 'sanity'

const SLOT_TONE: Record<
  KeyVisualSlotKind,
  'primary' | 'positive' | 'caution' | 'critical' | 'default'
> = {
  hero: 'critical',
  wide: 'critical',
  left: 'positive',
  pairCenter: 'primary',
  pairRight: 'primary',
  compact: 'default',
}

type KeyVisualPreviewProps = PreviewProps & {
  /** Passed from schema preview.prepare — image array item `_key`. */
  slotKey?: string
}

function KeyVisualsSlotLegend() {
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={3}>
        <Text size={1} muted>
          Layout slots update as you reorder. Drag photos so the best frames
          land on Hero Two-Columns (full right column). Slots are automatic from
          order — not a manual highlight. Middle + Right share a blue badge
          (they form a pair).
        </Text>
        <Flex gap={2} wrap="wrap">
          {KEY_VISUAL_SLOT_LEGEND.map((kind) => (
            <Badge key={kind} tone={SLOT_TONE[kind]} fontSize={0}>
              {KEY_VISUAL_SLOT_LABEL[kind]}
            </Badge>
          ))}
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

/**
 * Inline slot badge beside the default image preview (filename + thumb).
 * Same pattern as Sanity’s richer array-item preview guide.
 */
export function KeyVisualPreview(props: KeyVisualPreviewProps) {
  const {renderDefault, slotKey} = props
  const keyVisuals = useFormValue(['keyVisuals']) as
    | {_key?: string}[]
    | undefined

  const slot = useMemo(() => {
    if (!slotKey) return undefined
    return keyVisualSlotsByKey(keyVisuals).get(slotKey)
  }, [keyVisuals, slotKey])

  return (
    <Flex align="center" gap={2} style={{width: '100%', minWidth: 0}}>
      <Box flex={1} style={{minWidth: 0}}>
        {renderDefault(props)}
      </Box>
      {slot ? (
        <Badge tone={SLOT_TONE[slot]} fontSize={0} style={{flexShrink: 0}}>
          {KEY_VISUAL_SLOT_LABEL[slot]}
        </Badge>
      ) : null}
    </Flex>
  )
}
