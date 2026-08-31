import { urlForImage } from '@/lib/sanity';

type PortfolioImageEntry = {
  title?: string | null;
  featuredImage?: Parameters<typeof urlForImage>[0] | null;
};

export function mapPortfolioFeaturedImages(
  entries: readonly PortfolioImageEntry[],
  count: number,
) {
  const images = entries
    .filter((entry) => entry.featuredImage)
    .slice(0, count)
    .map((entry) => ({
      src: urlForImage(entry.featuredImage!).width(960).height(540).fit('crop').url(),
      alt: entry.title?.trim() || 'Portfolio still',
    }));

  return images;
}

export function attachImagesToTabbedPanelItems<
  T extends { label: string; description: string },
>(
  items: readonly T[],
  images: ReturnType<typeof mapPortfolioFeaturedImages>,
) {
  const fallback = images[0];

  return items.map((item, index) => ({
    ...item,
    imageSrc: images[index]?.src ?? fallback?.src ?? '',
    imageAlt: images[index]?.alt ?? fallback?.alt ?? 'Portfolio still',
  }));
}
