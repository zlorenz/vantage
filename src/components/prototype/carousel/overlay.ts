import {joinParts, trimPart} from '@display-titles';

export function composeOverlayCopy(parts: {
  brandName?: string | null;
  productName?: string | null;
  campaignTitle?: string | null;
}): {brandLine: string; campaignLine: string} {
  const brand = trimPart(parts.brandName);
  const product = trimPart(parts.productName);
  const campaign = trimPart(parts.campaignTitle);

  if (campaign) {
    return {
      brandLine: joinParts(brand, product),
      campaignLine: campaign,
    };
  }

  return {
    brandLine: brand,
    campaignLine: joinParts(brand, product),
  };
}

export function joinOverlayList(values: Array<string | null | undefined>): string {
  return values.map((value) => trimPart(value)).filter(Boolean).join(', ');
}