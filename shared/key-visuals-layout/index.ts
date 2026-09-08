/**
 * Key Visuals grid layout planner — shared by the Next.js gallery and Sanity
 * Studio slot badges so CMS order matches on-site rhythm.
 *
 * ---------------------------------------------------------------------------
 * Repeating grid algorithm (Figma 149:21711 → scalable CMS rhythm)
 * ---------------------------------------------------------------------------
 * Artboard content width 1860 with gap 15 → columns 610 : 1235 (≈32.8% : 66.4%).
 * Tile aspects from Figma (width/height):
 *   short  610/272 ≈ 2.243
 *   tall   610/340 ≈ 1.794
 *   hero   1235/688 ≈ 1.795  (≈ tall — same proportion, full right-column span)
 *
 * LEFT column cycle (chosen: Figma’s observed 5-tile sequence, not 2-cycle):
 *   short → tall → short → tall → tall
 *
 * RIGHT column cycle:
 *   pair → hero → pair
 * (2+1+2 = 5 images per cycle — balances left’s 5; 10 images per full band.)
 *
 * Full bands: while ≥10 remain, place one left cycle then one right cycle.
 * Track rendered height per column for the tail pass.
 *
 * Remainder (height-balanced): assign leftover units to the shorter column
 * (ties → left). Left unit = next LEFT_CYCLE tile; right unit = next
 * RIGHT_GROUPS step (pair if ≥2 remain, else single/hero).
 *
 * Low-count (n < 5): compact full-width tall stack; pair when two remain.
 * ---------------------------------------------------------------------------
 */

export type KeyVisualLayoutItem = {
  _key: string
}

/** width/height — Figma 610/272 */
export const ASPECT_SHORT = 610 / 272
/** width/height — Figma 610/340 and hero 1235/688 */
export const ASPECT_TALL = 610 / 340

export const LEFT_CYCLE = ['short', 'tall', 'short', 'tall', 'tall'] as const
export const RIGHT_GROUPS = ['pair', 'hero', 'pair'] as const

/** Figma gap between tiles / columns (px), used only for height accounting. */
export const TILE_GAP = 15
export const LEFT_COL_W = 610
export const RIGHT_COL_W = 1235

export type LeftAspect = (typeof LEFT_CYCLE)[number]
export type RightGroup = (typeof RIGHT_GROUPS)[number]

export type CompactRow<T extends KeyVisualLayoutItem> =
  | {kind: 'single'; item: T}
  | {kind: 'pair'; a: T; b: T}

export type RightRow<T extends KeyVisualLayoutItem> =
  | {kind: 'pair'; a: T; b: T}
  | {kind: 'hero'; item: T}
  | {kind: 'single'; item: T}

export type RhythmPlan<T extends KeyVisualLayoutItem> =
  | {mode: 'compact'; rows: CompactRow<T>[]}
  | {
      mode: 'rhythm'
      left: {item: T; aspect: LeftAspect}[]
      right: RightRow<T>[]
    }

/**
 * Studio / editor-facing slot for one image key.
 * `wide` = remainder full-span single (same visual width as hero).
 * Pair tiles: first = center column of the right band, second = right edge.
 */
export type KeyVisualSlotKind =
  | 'left'
  | 'pairCenter'
  | 'pairRight'
  | 'hero'
  | 'wide'
  | 'compact'

export const KEY_VISUAL_SLOT_LABEL: Record<KeyVisualSlotKind, string> = {
  hero: 'Hero Two-Columns',
  wide: 'Hero Two-Columns',
  left: 'Left Column',
  pairCenter: 'Middle Column',
  pairRight: 'Right Column',
  compact: 'Compact',
}

/** Legend order in Studio (omit `wide` — same label/tone as `hero`; omit
 * `compact` — only used when fewer than 5 images, so it clutters the legend). */
export const KEY_VISUAL_SLOT_LEGEND: KeyVisualSlotKind[] = [
  'hero',
  'left',
  'pairCenter',
  'pairRight',
]

function leftTileHeight(aspect: LeftAspect): number {
  return LEFT_COL_W / (aspect === 'short' ? ASPECT_SHORT : ASPECT_TALL)
}

function rightPairHeight(): number {
  return LEFT_COL_W / ASPECT_TALL
}

function rightSpanHeight(): number {
  return RIGHT_COL_W / ASPECT_TALL
}

export function planKeyVisualsLayout<T extends KeyVisualLayoutItem>(
  items: T[],
): RhythmPlan<T> {
  if (items.length < 5) {
    const rows: CompactRow<T>[] = []
    let i = 0
    while (i < items.length) {
      if (i + 1 < items.length) {
        rows.push({kind: 'pair', a: items[i], b: items[i + 1]})
        i += 2
      } else {
        rows.push({kind: 'single', item: items[i]})
        i += 1
      }
    }
    return {mode: 'compact', rows}
  }

  const left: {item: T; aspect: LeftAspect}[] = []
  const right: RightRow<T>[] = []
  let cursor = 0
  let leftH = 0
  let rightH = 0
  let leftStep = 0
  let rightStep = 0

  const pushLeft = (item: T, aspect: LeftAspect) => {
    if (left.length > 0) leftH += TILE_GAP
    leftH += leftTileHeight(aspect)
    left.push({item, aspect})
    leftStep += 1
  }

  const pushRightPair = (a: T, b: T) => {
    if (right.length > 0) rightH += TILE_GAP
    rightH += rightPairHeight()
    right.push({kind: 'pair', a, b})
    rightStep += 1
  }

  const pushRightHero = (item: T) => {
    if (right.length > 0) rightH += TILE_GAP
    rightH += rightSpanHeight()
    right.push({kind: 'hero', item})
    rightStep += 1
  }

  const pushRightSingle = (item: T) => {
    if (right.length > 0) rightH += TILE_GAP
    rightH += rightSpanHeight()
    right.push({kind: 'single', item})
    rightStep += 1
  }

  while (items.length - cursor >= 10) {
    for (let i = 0; i < LEFT_CYCLE.length; i++) {
      pushLeft(items[cursor], LEFT_CYCLE[i])
      cursor += 1
    }
    for (let g = 0; g < RIGHT_GROUPS.length; g++) {
      const group: RightGroup = RIGHT_GROUPS[g]
      if (group === 'pair') {
        pushRightPair(items[cursor], items[cursor + 1])
        cursor += 2
      } else {
        pushRightHero(items[cursor])
        cursor += 1
      }
    }
  }

  while (cursor < items.length) {
    if (leftH <= rightH) {
      const aspect = LEFT_CYCLE[leftStep % LEFT_CYCLE.length]
      pushLeft(items[cursor], aspect)
      cursor += 1
      continue
    }

    const group: RightGroup = RIGHT_GROUPS[rightStep % RIGHT_GROUPS.length]
    if (group === 'pair') {
      if (cursor + 1 < items.length) {
        pushRightPair(items[cursor], items[cursor + 1])
        cursor += 2
      } else {
        pushRightSingle(items[cursor])
        cursor += 1
      }
    } else {
      pushRightHero(items[cursor])
      cursor += 1
    }
  }

  return {mode: 'rhythm', left, right}
}

/** Map each item `_key` → layout slot for Studio badges / debugging. */
export function keyVisualSlotsByKey(
  items: readonly {_key?: string | null}[] | null | undefined,
): Map<string, KeyVisualSlotKind> {
  const ready = (items ?? []).filter(
    (item): item is {_key: string} => typeof item?._key === 'string' && item._key.length > 0,
  )
  const map = new Map<string, KeyVisualSlotKind>()
  if (ready.length === 0) return map

  const plan = planKeyVisualsLayout(ready)

  if (plan.mode === 'compact') {
    for (const row of plan.rows) {
      if (row.kind === 'pair') {
        map.set(row.a._key, 'pairCenter')
        map.set(row.b._key, 'pairRight')
      } else {
        map.set(row.item._key, 'compact')
      }
    }
    return map
  }

  for (const {item} of plan.left) {
    map.set(item._key, 'left')
  }
  for (const row of plan.right) {
    if (row.kind === 'pair') {
      map.set(row.a._key, 'pairCenter')
      map.set(row.b._key, 'pairRight')
    } else if (row.kind === 'hero') {
      map.set(row.item._key, 'hero')
    } else {
      map.set(row.item._key, 'wide')
    }
  }
  return map
}
