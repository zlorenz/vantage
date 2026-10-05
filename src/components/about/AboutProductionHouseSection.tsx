/**
 * AboutProductionHouseSection — flipped tabbed panel below Who We Are on /about.
 *
 * Prefers curated About Media advantages; falls back to recent portfolio.
 */

import {getLocale, getTranslations} from 'next-intl/server';
import {AboutTabbedPanelInteractive} from '@/components/about/AboutTabbedPanelInteractive';
import {SectionWrapper} from '@/components/ui/SectionWrapper';
import {
  loadAboutMedia,
  resolveAboutPreviewList,
  type AboutPreviewMedia,
} from '@/lib/about-media';
import {
  attachImagesToTabbedPanelItems,
  mapPortfolioFeaturedImages,
} from '@/lib/about-tabbed-panel-images';
import {sanityFetch} from '@/sanity/lib/live';
import {ABOUT_PRODUCTION_HOUSE_IMAGES_QUERY} from '@/sanity/queries/pages';
import type {ABOUT_PRODUCTION_HOUSE_IMAGES_QUERY_RESULT} from '@/sanity/sanity.types';

const ITEM_COUNT = 4;
const MEDIA_SIZE = {width: 960, height: 540};

export async function AboutProductionHouseSection() {
  const [t, locale, aboutMedia] = await Promise.all([
    getTranslations('About'),
    getLocale(),
    loadAboutMedia(),
  ]);

  const curated = resolveAboutPreviewList(
    aboutMedia?.advantages,
    locale,
    ITEM_COUNT,
    MEDIA_SIZE,
  );

  let images: AboutPreviewMedia[];
  if (curated) {
    images = curated;
  } else {
    const imageResult = await sanityFetch({
      query: ABOUT_PRODUCTION_HOUSE_IMAGES_QUERY,
      stega: false,
    });
    const imageEntries = (imageResult.data ??
      []) as ABOUT_PRODUCTION_HOUSE_IMAGES_QUERY_RESULT;
    images = mapPortfolioFeaturedImages(imageEntries, ITEM_COUNT);
  }

  const items = attachImagesToTabbedPanelItems(
    [
      {
        label: t('productionHouseItem1Label'),
        description: t('productionHouseItem1Description'),
      },
      {
        label: t('productionHouseItem2Label'),
        description: t('productionHouseItem2Description'),
      },
      {
        label: t('productionHouseItem3Label'),
        description: t('productionHouseItem3Description'),
      },
      {
        label: t('productionHouseItem4Label'),
        description: t('productionHouseItem4Description'),
      },
    ],
    images,
  );

  return (
    <SectionWrapper fullBleed className="vp-about-tabs-section bg-vp-bg text-vp-text">
      <div className="vp-content-rail">
        <AboutTabbedPanelInteractive
          sectionId="production-house"
          heading={t('productionHouseHeading')}
          eyebrow={t('productionHouseEyebrow')}
          items={items}
          imagePosition="left"
          theme="dark"
        />
      </div>
    </SectionWrapper>
  );
}
