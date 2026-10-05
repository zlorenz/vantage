/**
 * AboutWhoWeAreSection — server wrapper for the /about Who We Are panel.
 *
 * Prefers curated About Media specialties; falls back to recent portfolio.
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
import {ABOUT_WHO_WE_ARE_IMAGES_QUERY} from '@/sanity/queries/pages';
import type {ABOUT_WHO_WE_ARE_IMAGES_QUERY_RESULT} from '@/sanity/sanity.types';

const ITEM_COUNT = 4;
const MEDIA_SIZE = {width: 960, height: 540};

export async function AboutWhoWeAreSection() {
  const [t, locale, aboutMedia] = await Promise.all([
    getTranslations('About'),
    getLocale(),
    loadAboutMedia(),
  ]);

  const curated = resolveAboutPreviewList(
    aboutMedia?.specialties,
    locale,
    ITEM_COUNT,
    MEDIA_SIZE,
  );

  let images: AboutPreviewMedia[];
  if (curated) {
    images = curated;
  } else {
    const imageResult = await sanityFetch({
      query: ABOUT_WHO_WE_ARE_IMAGES_QUERY,
      stega: false,
    });
    const imageEntries = (imageResult.data ?? []) as ABOUT_WHO_WE_ARE_IMAGES_QUERY_RESULT;
    images = mapPortfolioFeaturedImages(imageEntries, ITEM_COUNT);
  }

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
    <SectionWrapper fullBleed className="vp-about-tabs-section bg-vp-bg text-vp-text">
      <div className="vp-content-rail">
        <AboutTabbedPanelInteractive
          sectionId="who-we-are"
          heading={t('whoWeAreHeading')}
          eyebrow={t('whoWeAreEyebrow')}
          items={items}
          imagePosition="right"
          theme="dark"
        />
      </div>
    </SectionWrapper>
  );
}
