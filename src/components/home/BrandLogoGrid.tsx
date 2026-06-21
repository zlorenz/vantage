/**
 * BrandLogoGrid — 4-column client logo wall with bordered cells.
 *
 * Server component. Logos from siteSettings.brandLogos (Sanity assets).
 */

import Image from 'next/image';
import { urlForImage } from '@/lib/sanity';
import type { SanityImage } from '@/types/sanity';

interface BrandLogoGridProps {
  logos?: SanityImage[];
}

export function BrandLogoGrid({ logos }: BrandLogoGridProps) {
  if (!logos?.length) return null;

  return (
    <div className="vp-brand-logos mx-auto grid max-w-[1100px] grid-cols-2 md:grid-cols-4">
      {logos.map((logo, index) => {
        const imageUrl = urlForImage(logo).width(400).height(200).url();
        return (
          <div
            key={logo.asset._ref ?? index}
            className="vp-brand-logos__cell flex items-center justify-center border border-vp-logo-grid-border p-6"
          >
            <Image
              src={imageUrl}
              alt=""
              width={200}
              height={100}
              className="vp-brand-logos__img h-auto w-full max-w-full object-contain"
            />
          </div>
        );
      })}
    </div>
  );
}
