/**
 * AboutWhoWeAreSection — server wrapper for the /about Who We Are panel.
 *
 * Resolves copy via next-intl and fetches portfolio placeholder images,
 * then passes plain props to AboutWhoWeAreInteractive (client).
 */

import { getTranslations } from 'next-intl/server';
import { AboutWhoWeAreInteractive, type WhoWeAreItem } from '@/components/about/AboutWhoWeAreInteractive';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { urlForImage } from '@/lib/sanity';
import { sanityFetch } from '@/sanity/lib/live';
import { ABOUT_WHO_WE_ARE_IMAGES_QUERY } from '@/sanity/queries/pages';
import type { ABOUT_WHO_WE_ARE_IMAGES_QUERY_RESULT } from '@/sanity/sanity.types';

const ITEM_COUNT = 4;

export async function AboutWhoWeAreSection() {
  const [t, imageResult] = await Promise.all([
    getTranslations('About'),
    sanityFetch({ query: ABOUT_WHO_WE_ARE_IMAGES_QUERY, stega: false }),
  ]);

  const imageEntries = (imageResult.data ?? []) as ABOUT_WHO_WE_ARE_IMAGES_QUERY_RESULT;

  const images = imageEntries
    .filter((entry) => entry.featuredImage)
    .slice(0, ITEM_COUNT)
    .map((entry) => ({
      src: urlForImage(entry.featuredImage!).width(960).height(540).fit('crop').url(),
      alt: entry.title?.trim() || 'Portfolio still',
    }));

  const labels = [
    t('whoWeAreItem1Label'),
    t('whoWeAreItem2Label'),
    t('whoWeAreItem3Label'),
    t('whoWeAreItem4Label'),
  ] as const;

  const descriptions = [
    t('whoWeAreItem1Description'),
    t('whoWeAreItem2Description'),
    t('whoWeAreItem3Description'),
    t('whoWeAreItem4Description'),
  ] as const;

  const items: WhoWeAreItem[] = labels.map((label, index) => ({
    label,
    description: descriptions[index],
    imageSrc: images[index]?.src ?? images[0]?.src ?? '',
    imageAlt: images[index]?.alt ?? images[0]?.alt ?? 'Portfolio still',
  }));

  return (
    <SectionWrapper fullBleed={true}>
      <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
        <AboutWhoWeAreInteractive heading={t('whoWeAreHeading')} items={items} />
      </div>
    </SectionWrapper>
  );
}
