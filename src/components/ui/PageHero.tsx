/**
 * PageHero — full-width hero with background image and centred title.
 *
 * Server component. Used on pages where showHeroHeader is true.
 * Title supports <span class="vp-outline"> via dangerouslySetInnerHTML
 * (Sanity editor-controlled content, not user input).
 */

import Image from 'next/image';
import { urlForImage } from '@/lib/sanity';
import type { SanityImage } from '@/types/sanity';

interface PageHeroProps {
  title: string;
  backgroundImage?: SanityImage;
}

export function PageHero({ title, backgroundImage }: PageHeroProps) {
  const imageUrl = backgroundImage
    ? urlForImage(backgroundImage).width(1920).height(1080).url()
    : null;

  return (
    <section className="vp-page-hero relative w-full">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : null}
      <div className="vp-page-hero__overlay absolute inset-0 bg-vp-overlay-dark" />
      <div className="vp-page-hero__inner relative z-[1] flex items-center justify-center px-4 py-[clamp(6rem,9vw,10rem)] pt-[clamp(8rem,12vw,13rem)]">
        <h1
          className="vp-page-hero__title m-0 text-center text-[clamp(2.25rem,4vw,3.75rem)] font-bold uppercase leading-tight tracking-vp-heading text-white"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
    </section>
  );
}
