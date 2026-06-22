/**
 * BrandLogoGrid — 4-column client logo wall with bordered cells.
 *
 * Server component. Logos from src/lib/client-logos.ts (static SVG registry).
 */

import Image from 'next/image';
import { getClientLogos, HOME_BRAND_LOGO_IDS } from '@/lib/client-logos';

export function BrandLogoGrid() {
  const logos = getClientLogos(HOME_BRAND_LOGO_IDS);

  return (
    <div className="vp-brand-logos mx-auto grid max-w-[1100px] grid-cols-2 gap-0 sm:grid-cols-4">
      {logos.map((logo) => (
        <div
          key={logo.id}
          className="vp-brand-logos__cell flex items-center justify-center border border-vp-logo-grid-border p-6"
        >
          <Image
            src={logo.file}
            alt={logo.name}
            width={200}
            height={100}
            unoptimized
            className="vp-brand-logos__img h-auto w-full max-w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}
