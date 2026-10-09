import { resolveCarouselPreviewPlayback } from '@portfolio-videos';
import {
  aboutPreviewPosterUrl,
  type AboutPreviewMedia,
} from '@/lib/about-media';

type PortfolioPreviewRow = {
  vimeoUrl?: string | null;
  previewCleanVimeoUrl?: string | null;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
};

type PortfolioImageEntry = {
  title?: string | null;
  featuredImage?: Parameters<typeof aboutPreviewPosterUrl>[0] | null;
  videos?: Array<PortfolioPreviewRow | null> | null;
};

export function mapPortfolioFeaturedImages(
  entries: readonly PortfolioImageEntry[],
  count: number,
): AboutPreviewMedia[] {
  const images = entries
    .filter((entry) => entry.featuredImage)
    .slice(0, count)
    .map((entry) => {
      const preview = resolveCarouselPreviewPlayback({
        videos: (entry.videos ?? []).filter(
          (row): row is PortfolioPreviewRow => row != null,
        ),
      });

      return {
        src: aboutPreviewPosterUrl(entry.featuredImage!),
        alt: entry.title?.trim() || 'Portfolio still',
        previewVimeoUrl: preview.vimeoUrl,
        previewStartSeconds: preview.previewStartSeconds,
        previewEndSeconds: preview.previewEndSeconds,
      };
    });

  return images;
}

export function attachImagesToTabbedPanelItems<
  T extends { label: string; description: string },
>(
  items: readonly T[],
  images: readonly AboutPreviewMedia[],
) {
  const fallback = images[0];

  return items.map((item, index) => {
    const image = images[index] ?? fallback;

    return {
      ...item,
      imageSrc: image?.src ?? '',
      imageAlt: image?.alt ?? 'Portfolio still',
      previewVimeoUrl: image?.previewVimeoUrl ?? null,
      previewStartSeconds: image?.previewStartSeconds ?? null,
      previewEndSeconds: image?.previewEndSeconds ?? null,
    };
  });
}
