/**
 * Work-internal key visuals — same Sanity order / rhythm as the public
 * KeyVisualsGallery, with internal card chrome (gap, radius, glass edge).
 * Cards open the shared lightbox chrome (counter, arrows, fullscreen).
 */

'use client';

import Image from 'next/image';
import {useState} from 'react';
import {
  ASPECT_SHORT,
  ASPECT_TALL,
  planKeyVisualsLayout,
} from '@key-visuals-layout';
import {urlForImage} from '@/lib/sanity';
import {snapNextImageWidth} from '../../../shared/next-image-sizes';
import type {InternalLibraryKeyVisual} from '@/types/sanity';
import {WorkInternalKeyVisualsLightbox} from './WorkInternalKeyVisualsLightbox';

type ReadyItem = InternalLibraryKeyVisual & {
  asset: NonNullable<InternalLibraryKeyVisual['asset']> & {_id: string};
};

const FALLBACK_WIDTH = 1200;

function KeyVisualCard({
  item,
  aspect,
  sizes,
  onOpen,
}: {
  item: ReadyItem;
  aspect: number;
  sizes: string;
  onOpen: () => void;
}) {
  const {asset} = item;
  const width = asset.metadata?.dimensions?.width || FALLBACK_WIDTH;
  const displayWidth = snapNextImageWidth(Math.min(width, 1600));
  const imageUrl = urlForImage({
    _type: 'image',
    asset: {_type: 'reference', _ref: asset._id},
  })
    .width(displayWidth)
    .url();

  return (
    <div className="vp-internal-card">
      <button
        type="button"
        className="vp-internal-card__hit"
        onClick={onOpen}
        aria-label={
          asset.altText?.trim()
            ? `Open key visual: ${asset.altText.trim()}`
            : 'Open key visual'
        }
      >
        <div
          className="vp-internal-card__media"
          style={{aspectRatio: `${aspect}`}}
        >
          <Image
            src={imageUrl}
            alt={asset.altText?.trim() || ''}
            fill
            sizes={sizes}
            className="object-cover"
          />
        </div>
      </button>
    </div>
  );
}

export function WorkInternalKeyVisuals({
  keyVisuals,
}: {
  keyVisuals?: InternalLibraryKeyVisual[] | null;
}) {
  const items = (keyVisuals ?? []).filter(
    (item): item is ReadyItem => Boolean(item?.asset?._id),
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  const plan = planKeyVisualsLayout(items);
  const indexOf = (item: ReadyItem) =>
    items.findIndex((entry) => entry._key === item._key);

  return (
    <>
      {plan.mode === 'compact' ? (
        <div className="vp-internal-detail__kv-gallery vp-internal-detail__kv-gallery--compact">
          {plan.rows.map((row) =>
            row.kind === 'pair' ? (
              <div
                key={`${row.a._key}-${row.b._key}`}
                className="vp-internal-detail__kv-pair"
              >
                <KeyVisualCard
                  item={row.a}
                  aspect={ASPECT_TALL}
                  sizes="(max-width: 639px) 100vw, 50vw"
                  onOpen={() => setActiveIndex(indexOf(row.a))}
                />
                <KeyVisualCard
                  item={row.b}
                  aspect={ASPECT_TALL}
                  sizes="(max-width: 639px) 100vw, 50vw"
                  onOpen={() => setActiveIndex(indexOf(row.b))}
                />
              </div>
            ) : (
              <KeyVisualCard
                key={row.item._key}
                item={row.item}
                aspect={ASPECT_TALL}
                sizes="(max-width: 639px) 100vw, 100vw"
                onOpen={() => setActiveIndex(indexOf(row.item))}
              />
            ),
          )}
        </div>
      ) : (
        <div className="vp-internal-detail__kv-gallery vp-internal-detail__kv-gallery--rhythm">
          <div className="vp-internal-detail__kv-col vp-internal-detail__kv-col--left">
            {plan.left.map(({item, aspect}) => (
              <KeyVisualCard
                key={item._key}
                item={item}
                aspect={aspect === 'short' ? ASPECT_SHORT : ASPECT_TALL}
                sizes="(max-width: 991px) 100vw, 20vw"
                onOpen={() => setActiveIndex(indexOf(item))}
              />
            ))}
          </div>
          <div className="vp-internal-detail__kv-col vp-internal-detail__kv-col--right">
            {plan.right.map((row) => {
              if (row.kind === 'pair') {
                return (
                  <div
                    key={`${row.a._key}-${row.b._key}`}
                    className="vp-internal-detail__kv-pair"
                  >
                    <KeyVisualCard
                      item={row.a}
                      aspect={ASPECT_TALL}
                      sizes="(max-width: 991px) 100vw, 20vw"
                      onOpen={() => setActiveIndex(indexOf(row.a))}
                    />
                    <KeyVisualCard
                      item={row.b}
                      aspect={ASPECT_TALL}
                      sizes="(max-width: 991px) 100vw, 20vw"
                      onOpen={() => setActiveIndex(indexOf(row.b))}
                    />
                  </div>
                );
              }
              return (
                <KeyVisualCard
                  key={row.item._key}
                  item={row.item}
                  aspect={ASPECT_TALL}
                  sizes="(max-width: 991px) 100vw, 40vw"
                  onOpen={() => setActiveIndex(indexOf(row.item))}
                />
              );
            })}
          </div>
        </div>
      )}

      {activeIndex !== null ? (
        <WorkInternalKeyVisualsLightbox
          items={items}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      ) : null}
    </>
  );
}
