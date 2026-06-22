/**
 * ImageGalleryBlock — masonry column gallery from Portable Text imageGallery blocks.
 */

import Image from 'next/image';
import { urlForImage } from '@/lib/sanity';
import type { SanityImage } from '@/types/sanity';

export interface GalleryImageItem {
  _key?: string;
  image: SanityImage;
  alt?: string;
  caption?: string;
}

interface ImageGalleryBlockProps {
  columns: number;
  images: GalleryImageItem[];
}

export function ImageGalleryBlock({ columns, images }: ImageGalleryBlockProps) {
  if (!images?.length) return null;

  return (
    <div
      className="vp-masonry-gallery vp-masonry-gallery--bleed my-8"
      style={{ '--vp-gallery-columns': columns } as React.CSSProperties}
    >
      {images.map((item, index) => {
        if (!item.image?.asset) return null;
        const imageUrl = urlForImage(item.image).width(1200).url();
        return (
          <figure key={item._key ?? index} className="vp-masonry-gallery__item">
            <Image
              src={imageUrl}
              alt={item.alt ?? item.caption ?? ''}
              width={1200}
              height={800}
              className="h-auto w-full"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            {item.caption ? (
              <figcaption className="vp-masonry-gallery__caption">{item.caption}</figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
