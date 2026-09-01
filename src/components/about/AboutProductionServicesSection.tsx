/**
 * AboutProductionServicesSection — image band, location marquee, and body CTA.
 */

import type { SanityImageSource } from '@sanity/image-url';
import { getTranslations } from 'next-intl/server';
import { AboutProductionServicesMarquee } from '@/components/about/AboutProductionServicesMarquee';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { VpButton } from '@/components/ui/VpButton';
import { urlForImage } from '@/lib/sanity';
import './about-production-services.css';

type AboutProductionServicesSectionProps = {
  backgroundImage?: SanityImageSource | null;
};

export async function AboutProductionServicesSection({
  backgroundImage,
}: AboutProductionServicesSectionProps) {
  const t = await getTranslations('About');

  const imageUrl = backgroundImage
    ? urlForImage(backgroundImage).width(1920).height(1080).fit('crop').url()
    : null;

  return (
    <SectionWrapper borderTop fullBleed>
      <div className="vp-about-production-services">
        <div
          className="vp-about-production-services__band"
          style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
        >
          <div
            className="vp-about-production-services__band-overlay"
            aria-hidden
          />
          <div className="vp-about-production-services__band-inner">
            <p className="vp-about-production-services__eyebrow">
              {t('productionServicesOutline')}
            </p>
            <h2 className="vp-about-production-services__heading">
              {t('productionServices')}
            </h2>
          </div>
        </div>

        <AboutProductionServicesMarquee />

        <div className="vp-about-production-services__panel">
          <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
            <p className="m-0 max-w-[700px] font-light leading-relaxed text-vp-text-muted">
              {t('productionServicesBody')}
            </p>
            <div className="mt-8">
              <VpButton href="/vietnam-production-service">
                {t('productionServicesCta')}
              </VpButton>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
