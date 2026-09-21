/**
 * ImagePairBlock — two side-by-side body images (Figma 2281:12989).
 * Stacks below 768px. Caption fallback matches single PT image blocks.
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
  };
};

export type ImagePairValue = {
  left?: PairImage | null;
  right?: PairImage | null;
};

type ImagePairBlockProps = {
  value: ImagePairValue;
};

function resolveAlt(image: PairImage): string {
  return image.alt?.trim() || image.asset?.altText?.trim() || '';
}

function resolveCaption(image: PairImage): string {
  return image.caption?.trim() || image.asset?.description?.trim() || '';
}

function PairSlot({image}: {image: PairImage}) {
  if (!image?.asset) return null;
  const imageUrl = urlForImage(image).width(1200).url();
  const alt = resolveAlt(image);
  const caption = resolveCaption(image);

  return (
    <figure className="vp-image-pair__slot">
      <div className="vp-image-pair__brackets" aria-hidden="true">
        <span className="vp-image-pair__bracket vp-image-pair__bracket--tl" />
        <span className="vp-image-pair__bracket vp-image-pair__bracket--tr" />
        <span className="vp-image-pair__bracket vp-image-pair__bracket--br" />
        <span className="vp-image-pair__bracket vp-image-pair__bracket--bl" />
      </div>
      <div className="vp-image-pair__media">
        <Image
          src={imageUrl}
          alt={alt}
          width={1200}
          height={1600}
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
      {left?.asset ? <PairSlot image={left} /> : <div className="vp-image-pair__slot" />}
      {right?.asset ? <PairSlot image={right} /> : <div className="vp-image-pair__slot" />}
    </div>
  );
}
