/**
 * AboutWhoWeAreSection — server wrapper for the /about Who We Are panel.
 *
 * Resolves copy via next-intl and fetches portfolio placeholder images,
 * then passes plain props to AboutTabbedPanelInteractive (client).
 */

import { getTranslations } from 'next-intl/server';
import { AboutTabbedPanelInteractive } from '@/components/about/AboutTabbedPanelInteractive';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import {
  attachImagesToTabbedPanelItems,
  mapPortfolioFeaturedImages,
} from '@/lib/about-tabbed-panel-images';
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
  const images = mapPortfolioFeaturedImages(imageEntries, ITEM_COUNT);

  const items = attachImagesToTabbedPanelItems(
    [
      {
        label: t('whoWeAreItem1Label'),
        description: t('whoWeAreItem1Description'),
      },
      {
        label: t('whoWeAreItem2Label'),
        description: t('whoWeAreItem2Description'),
      },
      {
        label: t('whoWeAreItem3Label'),
        description: t('whoWeAreItem3Description'),
      },
      {
        label: t('whoWeAreItem4Label'),
        description: t('whoWeAreItem4Description'),
      },
    ],
    images,
  );

  return (
    <SectionWrapper fullBleed className="bg-white text-black">
      <div className="vp-content-rail">
        <AboutTabbedPanelInteractive
          sectionId="who-we-are"
          heading={t('whoWeAreHeading')}
          items={items}
          imagePosition="right"
        />
      </div>
    </SectionWrapper>
  );
}
