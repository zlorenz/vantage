/**
 * BrandLogoGrid — 4-column client logo wall with bordered cells.
 *
 * Server component. Logo order from CMS `page.brandLogos` (fallback: HOME_BRAND_LOGO_IDS).
 */

import Image from 'next/image';
import {
  getClientLogos,
  HOME_BRAND_LOGO_IDS,
  isClientLogoId,
  type ClientLogoId,
} from '@client-logos';

type BrandLogoGridProps = {
  /** Ordered logo ids from Sanity (`brandLogos[].logoId`). */
  logoIds?: string[] | null;
};

export function BrandLogoGrid({logoIds}: BrandLogoGridProps) {
  const resolvedIds: ClientLogoId[] = (logoIds ?? [])
    .filter(isClientLogoId);
  const ids = resolvedIds.length > 0 ? resolvedIds : [...HOME_BRAND_LOGO_IDS];
  const logos = getClientLogos(ids);

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
