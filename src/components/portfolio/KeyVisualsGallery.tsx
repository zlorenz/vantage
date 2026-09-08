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
 * Consumption / balance:
 *   Each band takes 5 left + 5 right. Remainder after full bands is filled
 *   left-first through the same cycles until images run out (partial cycles
 *   allowed). Common counts 6 / 9 / 15 therefore cannot leave one column empty
 *   while the other piles up.
 *
 * Low-count fallback (n < 5): Figma’s two-column rhythm needs enough tiles to
 * read; below that, use a single full-width stack of `tall` slots, grouping
 * consecutive pairs when two remain (so 3 → pair + one; 4 → two pairs; 1–2
 * accordingly). Avoids a sparse half-empty second column.
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

interface KeyVisualsGalleryProps {
  keyVisuals?: KeyVisualItem[] | null;
}

const FALLBACK_WIDTH = 1200;
const FALLBACK_HEIGHT = 800;

export function KeyVisualsGallery({keyVisuals}: KeyVisualsGalleryProps) {
  const items = (keyVisuals ?? []).filter(
    (item): item is KeyVisualItem & {asset: KeyVisualAsset} =>
      Boolean(item?.asset?._id),
  );
  if (items.length === 0) return null;

  return (
    <section className="vp-key-visuals" aria-labelledby="key-visuals-heading">
      <h2 id="key-visuals-heading" className="vp-key-visuals__title">
        <span className="vp-key-visuals__bullet" aria-hidden>
          ●
        </span>
        {`  Key Visuals`}
      </h2>
      <div className="vp-key-visuals-gallery">
        {items.map((item) => {
          const {asset} = item;
          const width = asset.metadata?.dimensions?.width || FALLBACK_WIDTH;
          const height = asset.metadata?.dimensions?.height || FALLBACK_HEIGHT;
          const displayWidth = snapNextImageWidth(Math.min(width, 1600));
          const displayHeight = Math.round((height / width) * displayWidth);
          const imageUrl = urlForImage({
            _type: 'image',
            asset: {_type: 'reference', _ref: asset._id},
          })
            .width(displayWidth)
            .url();

          return (
            <figure key={item._key} className="vp-key-visuals-gallery__item">
              <Image
                src={imageUrl}
                alt={asset.altText?.trim() || ''}
                width={displayWidth}
                height={displayHeight}
                className="vp-key-visuals-gallery__img"
                sizes="(max-width: 639px) 100vw, 33vw"
              />
            </figure>
          );
        })}
      </div>
    </section>
  );
}
