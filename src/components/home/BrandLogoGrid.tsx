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
    <div className="vp-brand-logos">
      {logos.map((logo) => (
        <div key={logo.id} className="vp-brand-logos__cell">
          <figure
            className={
              logo.id === 'zhiyun'
                ? 'vp-brand-logos__figure vp-brand-logos__figure--zhiyun'
                : 'vp-brand-logos__figure'
            }
          >
            <Image
              src={logo.file}
              alt={logo.name}
              width={718}
              height={412}
              unoptimized
              className="vp-brand-logos__img"
            />
          </figure>
        </div>
      ))}
    </div>
  );
}
