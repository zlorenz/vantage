/**
 * KeyVisualsGallery — still-photography section below crew credits.
 * Renders nothing when the array is empty (no heading, no empty shell).
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
 * Why: matches the authored left stack on 149:21711 and varies height more
 * than short/tall alternation alone, without inventing a third ratio.
 *
 * RIGHT column cycle (cleaned vs Figma’s one-off pair→hero→pair→pair):
 *   pair → hero → pair
 * Why: 2+1+2 = 5 images per cycle — equal to the left’s 5 — so columns stay
 * balanced as the list grows (10 images per full left+right band). “Hero every
 * 3rd group” in Figma terms; drops the trailing extra pair from the mock.
 *
 * Full bands:
 *   While ≥10 images remain, place one complete left cycle (5) then one
 *   complete right cycle (pair→hero→pair = 5). Track rendered height per
 *   column (tile heights at Figma widths + 15px gaps) for the tail pass.
 *
 * Remainder (height-balanced, not left-first):
 *   After full bands, assign leftover images one placement unit at a time to
 *   whichever column has less accumulated height (ties → left). Left unit =
 *   next short/tall in LEFT_CYCLE (1 image). Right unit = next RIGHT_GROUPS
 *   step (pair if ≥2 images remain, else a single/hero tile). This prevents
 *   tails like n=12 (2 leftovers) from stacking both in the left column while
 *   the shorter right column sits empty.
 *
 * Low-count fallback (n < 5): unchanged — single full-width stack of `tall`
 * slots, grouping consecutive pairs when two remain.
 *
 * Slot fill: object-fit cover into the assigned aspect (Figma tiles are fixed
 * proportions, not intrinsic image ratios).
 * ---------------------------------------------------------------------------
 */

import Image from 'next/image';
import {urlForImage} from '@/lib/sanity';
import {snapNextImageWidth} from '../../../shared/next-image-sizes';

export type KeyVisualAsset = {
  _id: string;
  _type?: string;
  url?: string | null;
  title?: string | null;
  altText?: string | null;
  description?: string | null;
  /** Plugin field — typegen types as null only; runtime is string | null. */
  creditLine?: string | null;
  metadata?: {
    dimensions?: {
      width?: number | null;
      height?: number | null;
      aspectRatio?: number | null;
    } | null;
  } | null;
};

export type KeyVisualItem = {
  _key: string;
  _type?: 'image';
  asset?: KeyVisualAsset | null;
  hotspot?: unknown;
  crop?: unknown;
};

type ReadyItem = KeyVisualItem & {asset: KeyVisualAsset};

interface KeyVisualsGalleryProps {
  keyVisuals?: KeyVisualItem[] | null;
}

/** width/height — Figma 610/272 */
const ASPECT_SHORT = 610 / 272;
/** width/height — Figma 610/340 and hero 1235/688 */
const ASPECT_TALL = 610 / 340;

const LEFT_CYCLE = ['short', 'tall', 'short', 'tall', 'tall'] as const;
const RIGHT_GROUPS = ['pair', 'hero', 'pair'] as const;

/** Figma gap between tiles / columns (px), used only for height accounting. */
const TILE_GAP = 15;
const LEFT_COL_W = 610;
const RIGHT_COL_W = 1235;

type LeftAspect = (typeof LEFT_CYCLE)[number];
type RightGroup = (typeof RIGHT_GROUPS)[number];

type CompactRow =
  | {kind: 'single'; item: ReadyItem}
  | {kind: 'pair'; a: ReadyItem; b: ReadyItem};

type RightRow =
  | {kind: 'pair'; a: ReadyItem; b: ReadyItem}
  | {kind: 'hero'; item: ReadyItem}
  | {kind: 'single'; item: ReadyItem};

type RhythmPlan = {
  mode: 'compact';
  rows: CompactRow[];
} | {
  mode: 'rhythm';
  left: {item: ReadyItem; aspect: LeftAspect}[];
  right: RightRow[];
};

const FALLBACK_WIDTH = 1200;

function leftTileHeight(aspect: LeftAspect): number {
  return LEFT_COL_W / (aspect === 'short' ? ASPECT_SHORT : ASPECT_TALL);
}

function rightPairHeight(): number {
  return LEFT_COL_W / ASPECT_TALL; // each pair cell ≈ 610 wide at tall ratio
}

function rightSpanHeight(): number {
  return RIGHT_COL_W / ASPECT_TALL; // hero / single across the right column
}

function planKeyVisualsLayout(items: ReadyItem[]): RhythmPlan {
  if (items.length < 5) {
    const rows: CompactRow[] = [];
    let i = 0;
    while (i < items.length) {
      if (i + 1 < items.length) {
        rows.push({kind: 'pair', a: items[i], b: items[i + 1]});
        i += 2;
      } else {
        rows.push({kind: 'single', item: items[i]});
        i += 1;
      }
    }
    return {mode: 'compact', rows};
  }

  const left: {item: ReadyItem; aspect: LeftAspect}[] = [];
  const right: RightRow[] = [];
  let cursor = 0;
  let leftH = 0;
  let rightH = 0;
  let leftStep = 0;
  let rightStep = 0;

  const pushLeft = (item: ReadyItem, aspect: LeftAspect) => {
    if (left.length > 0) leftH += TILE_GAP;
    leftH += leftTileHeight(aspect);
    left.push({item, aspect});
    leftStep += 1;
  };

  const pushRightPair = (a: ReadyItem, b: ReadyItem) => {
    if (right.length > 0) rightH += TILE_GAP;
    rightH += rightPairHeight();
    right.push({kind: 'pair', a, b});
    rightStep += 1;
  };

  const pushRightHero = (item: ReadyItem) => {
    if (right.length > 0) rightH += TILE_GAP;
    rightH += rightSpanHeight();
    right.push({kind: 'hero', item});
    rightStep += 1;
  };

  const pushRightSingle = (item: ReadyItem) => {
    if (right.length > 0) rightH += TILE_GAP;
    rightH += rightSpanHeight();
    right.push({kind: 'single', item});
    rightStep += 1;
  };

  // Full bands: 5 left + 5 right while enough images remain.
  while (items.length - cursor >= 10) {
    for (let i = 0; i < LEFT_CYCLE.length; i++) {
      pushLeft(items[cursor], LEFT_CYCLE[i]);
      cursor += 1;
    }
    for (let g = 0; g < RIGHT_GROUPS.length; g++) {
      const group: RightGroup = RIGHT_GROUPS[g];
      if (group === 'pair') {
        pushRightPair(items[cursor], items[cursor + 1]);
        cursor += 2;
      } else {
        pushRightHero(items[cursor]);
        cursor += 1;
      }
    }
  }

  // Remainder: assign to the shorter column (height-balanced).
  while (cursor < items.length) {
    if (leftH <= rightH) {
      const aspect = LEFT_CYCLE[leftStep % LEFT_CYCLE.length];
      pushLeft(items[cursor], aspect);
      cursor += 1;
      continue;
    }

    const group: RightGroup = RIGHT_GROUPS[rightStep % RIGHT_GROUPS.length];
    if (group === 'pair') {
      if (cursor + 1 < items.length) {
        pushRightPair(items[cursor], items[cursor + 1]);
        cursor += 2;
      } else {
        pushRightSingle(items[cursor]);
        cursor += 1;
      }
    } else {
      pushRightHero(items[cursor]);
      cursor += 1;
    }
  }

  return {mode: 'rhythm', left, right};
}

function KeyVisualFigure({
  item,
  aspect,
  sizes,
}: {
  item: ReadyItem;
  aspect: number;
  sizes: string;
}) {
  const {asset} = item;
  const width = asset.metadata?.dimensions?.width || FALLBACK_WIDTH;
  const displayWidth = snapNextImageWidth(Math.min(width, 1600));
  const displayHeight = Math.max(1, Math.round(displayWidth / aspect));
  const imageUrl = urlForImage({
    _type: 'image',
    asset: {_type: 'reference', _ref: asset._id},
  })
    .width(displayWidth)
    .height(displayHeight)
    .fit('crop')
    .url();

  return (
    <figure
      className="vp-key-visuals-gallery__item"
      style={{aspectRatio: `${aspect}`}}
    >
      <Image
        src={imageUrl}
        alt={asset.altText?.trim() || ''}
        fill
        className="vp-key-visuals-gallery__img"
        sizes={sizes}
      />
    </figure>
  );
}

export function KeyVisualsGallery({keyVisuals}: KeyVisualsGalleryProps) {
  const items = (keyVisuals ?? []).filter(
    (item): item is ReadyItem => Boolean(item?.asset?._id),
  );
  if (items.length === 0) return null;

  const plan = planKeyVisualsLayout(items);

  return (
    <section className="vp-key-visuals" aria-labelledby="key-visuals-heading">
      <h2 id="key-visuals-heading" className="vp-key-visuals__title">
        <span className="vp-key-visuals__bullet" aria-hidden>
          ●
        </span>
        {`  Key Visuals`}
      </h2>

      {plan.mode === 'compact' ? (
        <div className="vp-key-visuals-gallery vp-key-visuals-gallery--compact">
          {plan.rows.map((row) =>
            row.kind === 'pair' ? (
              <div
                key={`${row.a._key}-${row.b._key}`}
                className="vp-key-visuals-gallery__pair"
              >
                <KeyVisualFigure
                  item={row.a}
                  aspect={ASPECT_TALL}
                  sizes="(max-width: 639px) 100vw, 50vw"
                />
                <KeyVisualFigure
                  item={row.b}
                  aspect={ASPECT_TALL}
                  sizes="(max-width: 639px) 100vw, 50vw"
                />
              </div>
            ) : (
              <KeyVisualFigure
                key={row.item._key}
                item={row.item}
                aspect={ASPECT_TALL}
                sizes="(max-width: 639px) 100vw, 100vw"
              />
            ),
          )}
        </div>
      ) : (
        <div className="vp-key-visuals-gallery vp-key-visuals-gallery--rhythm">
          <div className="vp-key-visuals-gallery__col vp-key-visuals-gallery__col--left">
            {plan.left.map(({item, aspect}) => (
              <KeyVisualFigure
                key={item._key}
                item={item}
                aspect={aspect === 'short' ? ASPECT_SHORT : ASPECT_TALL}
                sizes="(max-width: 991px) 100vw, 33vw"
              />
            ))}
          </div>
          <div className="vp-key-visuals-gallery__col vp-key-visuals-gallery__col--right">
            {plan.right.map((row) => {
              if (row.kind === 'pair') {
                return (
                  <div
                    key={`${row.a._key}-${row.b._key}`}
                    className="vp-key-visuals-gallery__pair"
                  >
                    <KeyVisualFigure
                      item={row.a}
                      aspect={ASPECT_TALL}
                      sizes="(max-width: 991px) 100vw, 33vw"
                    />
                    <KeyVisualFigure
                      item={row.b}
                      aspect={ASPECT_TALL}
                      sizes="(max-width: 991px) 100vw, 33vw"
                    />
                  </div>
                );
              }
              if (row.kind === 'hero') {
                return (
                  <KeyVisualFigure
                    key={row.item._key}
                    item={row.item}
                    aspect={ASPECT_TALL}
                    sizes="(max-width: 991px) 100vw, 66vw"
                  />
                );
              }
              return (
                <KeyVisualFigure
                  key={row.item._key}
                  item={row.item}
                  aspect={ASPECT_TALL}
                  sizes="(max-width: 991px) 100vw, 66vw"
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
