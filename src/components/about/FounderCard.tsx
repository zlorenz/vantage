/**
 * FounderCard — About page team member portrait with name overlay.
 */

import Image from 'next/image';
import { urlForImage } from '@/lib/sanity';
import type { Founder } from '@/types/sanity';

interface FounderCardProps {
  founder: Founder;
}

export function FounderCard({ founder }: FounderCardProps) {
  const imageUrl = urlForImage(founder.image).width(600).height(750).fit('crop').url();

  return (
    <article className="vp-founder-card relative aspect-[3/4] overflow-hidden">
      <Image
        src={imageUrl}
        alt={founder.name}
        fill
        className="object-cover"
        sizes="(max-width: 767px) 50vw, 25vw"
      />
      <div className="vp-founder-card__name absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-4">
        <p className="m-0 text-center text-sm font-bold uppercase tracking-vp-heading text-white md:text-base">
          {founder.name}
        </p>
      </div>
    </article>
  );
}
