/**
 * ImagePairBlock — two side-by-side body images.
 * Equal height, widths from each image’s aspect; fits the content column.
 * Stacks below 768px.
 */

import Image from 'next/image';
import {urlForImage} from '@/lib/sanity';
import type {SanityImage} from '@/types/sanity';
import './image-pair.css';

type PairImage = SanityImage & {
  alt?: string;
  caption?: string;
  asset?: {
    _ref?: string;
    _id?: string;
    altText?: string | null;
    description?: string | null;
    metadata?: {
      dimensions?: {
        width?: number | null;
        height?: number | null;
      } | null;
    } | null;
  };
};

export type ImagePairValue = {
  left?: PairImage | null;
  right?: PairImage | null;
};

type ImagePairBlockProps = {
  value: ImagePairValue;
};

const PAIR_FALLBACK = {width: 3, height: 2} as const;

function resolveAlt(image: PairImage): string {
  return image.alt?.trim() || image.asset?.altText?.trim() || '';
}

function resolveCaption(image: PairImage): string {
  return image.caption?.trim() || image.asset?.description?.trim() || '';
}

/** Intrinsic size after optional Sanity crop (matches what urlForImage serves). */
function imageDisplaySize(image: PairImage) {
  const rawW = image.asset?.metadata?.dimensions?.width;
  const rawH = image.asset?.metadata?.dimensions?.height;
  if (!rawW || !rawH || rawW <= 0 || rawH <= 0) {
    return PAIR_FALLBACK;
  }

  const crop = image.crop;
  const width = crop
    ? rawW * (1 - (crop.left ?? 0) - (crop.right ?? 0))
    : rawW;
  const height = crop
    ? rawH * (1 - (crop.top ?? 0) - (crop.bottom ?? 0))
    : rawH;

  if (width <= 0 || height <= 0) return PAIR_FALLBACK;
  return {width: Math.round(width), height: Math.round(height)};
}

function PairSlot({
  image,
  side,
}: {
  image: PairImage;
  side: 'left' | 'right';
}) {
  if (!image?.asset) return null;
  const intrinsic = imageDisplaySize(image);
  const aspect = intrinsic.width / intrinsic.height;
  // Wide enough for retina at ~half column; preserve aspect (no square crop).
  const imageUrl = urlForImage(image).width(1800).fit('max').quality(90).url();
  const alt = resolveAlt(image);
  const caption = resolveCaption(image);

  return (
    <figure
      className={`vp-image-pair__slot vp-image-pair__slot--${side}`}
      style={{
        // Grow proportional to aspect → equal heights, natural widths, fits row.
        flexGrow: aspect,
        flexShrink: 1,
        flexBasis: 0,
      }}
    >
      <div className="vp-image-pair__brackets" aria-hidden="true">
        <span className="vp-image-pair__bracket vp-image-pair__bracket--tl" />
        <span className="vp-image-pair__bracket vp-image-pair__bracket--tr" />
        <span className="vp-image-pair__bracket vp-image-pair__bracket--br" />
        <span className="vp-image-pair__bracket vp-image-pair__bracket--bl" />
      </div>
      <div
        className="vp-image-pair__media"
        style={{aspectRatio: `${intrinsic.width} / ${intrinsic.height}`}}
      >
        <Image
          src={imageUrl}
          alt={alt}
          width={intrinsic.width}
          height={intrinsic.height}
          quality={90}
          className="vp-image-pair__img"
          sizes="(max-width: 767px) 100vw, 50vw"
        />
      </div>
      {caption ? (
        <figcaption className="vp-image-pair__caption">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

export function ImagePairBlock({value}: ImagePairBlockProps) {
  const left = value.left;
  const right = value.right;
  if (!left?.asset && !right?.asset) return null;

  return (
    <div className="vp-image-pair">
      {left?.asset ? <PairSlot image={left} side="left" /> : null}
      {right?.asset ? <PairSlot image={right} side="right" /> : null}
    </div>
  );
}
