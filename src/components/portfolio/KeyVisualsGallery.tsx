/**
 * KeyVisualsGallery — still-photography section below crew credits.
 * Renders nothing when the array is empty (no heading, no empty shell).
 *
 * Layout rhythm lives in `@key-visuals-layout` (shared with Studio slot badges).
 */

import Image from 'next/image';
import {
  ASPECT_SHORT,
  ASPECT_TALL,
  planKeyVisualsLayout,
} from '@key-visuals-layout';
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

const FALLBACK_WIDTH = 1200;

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
