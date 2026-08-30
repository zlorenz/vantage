/**
 * KeyVisualsGallery — masonry still-photography section below crew credits.
 * Renders nothing when the array is empty (no heading, no empty shell).
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
      <h2
        id="key-visuals-heading"
        className="vp-key-visuals__title mb-10 font-vp-heading text-[clamp(2.125rem,3.5vw,2.875rem)] font-bold uppercase leading-tight tracking-vp-heading text-vp-text"
      >
        Key Visuals
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
