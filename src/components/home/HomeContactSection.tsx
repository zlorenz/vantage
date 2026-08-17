/**
 * Temporary Home contact mock-up — VP Color Section (brand orange, black text).
 * Placeholder until a designed section lands. Not the sitewide SiteFooter.
 */

import {getTranslations} from 'next-intl/server';
import {FooterSocials} from '@/components/layout/SiteFooter';
import {sanityClient} from '@/lib/sanity';
import {SITE_SETTINGS_QUERY} from '@/sanity/queries/global';
import type {SiteSettings} from '@/types/sanity';

const TEMP_EMAIL = 'info@vantage.pictures';
const TEMP_PHONE = '+84 32 7202070';
const TEMP_PHONE_HREF = 'tel:+84327202070';
const TEMP_ADDRESS =
  '67/26 Hoàng Hoa Thám, Phường Gia Định, TP Hồ Chí Minh, Việt Nam';

export async function HomeContactSection() {
  const [t, siteSettings] = await Promise.all([
    getTranslations('Home'),
    sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
  ]);

  return (
    <section
      className="vp-home-contact bg-vp-orange py-[var(--vp-section-y)] text-black"
      aria-labelledby="vp-home-contact-heading"
    >
      <div className="container mx-auto max-w-[1400px] px-4">
        <h2
          id="vp-home-contact-heading"
          className="mb-8 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase tracking-vp-heading"
        >
          {t('contactHeading')}
        </h2>
        <div className="flex flex-col gap-3 text-base">
          <p className="m-0">
            <a
              href={`mailto:${TEMP_EMAIL}`}
              className="font-bold text-black no-underline hover:underline"
            >
              {TEMP_EMAIL}
            </a>
          </p>
          <p className="m-0">
            <a
              href={TEMP_PHONE_HREF}
              className="font-bold text-black no-underline hover:underline"
            >
              {TEMP_PHONE}
            </a>
          </p>
          <p className="m-0 max-w-xl">{TEMP_ADDRESS}</p>
          {siteSettings ? (
            <FooterSocials
              siteSettings={siteSettings}
              linkClassName="inline-flex text-black transition-opacity duration-vp-fast hover:opacity-70"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
