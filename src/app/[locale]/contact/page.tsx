/**
 * Contact page — centered display statement + bottom contact bar
 * (email / WhatsApp / socials from siteSettings) + Campaign Brief CTA.
 *
 * Page doc (CONTACT_PAGE_QUERY) supplies the big statement via
 * heroTitle / heroTitleZh (repurposed from the old page-header title —
 * update the CMS values in Studio after this ships) plus SEO fields.
 * Contact details come from the `siteSettings` singleton via
 * SITE_SETTINGS_QUERY.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FooterSocials } from '@/components/layout/SiteFooter';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { VpButton } from '@/components/ui/VpButton';
import { routing, type Locale } from '@/i18n/routing';
import {
  aboutContactPageTitle,
  resolveMetadataImage,
  buildPageMetadata,
  seoDescription,
  seoMetaTitle,
} from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import {
  buildBreadcrumbs,
  contactBreadcrumb,
  homeBreadcrumb,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { CONTACT_PAGE_QUERY } from '@/sanity/queries/pages';
import { SITE_SETTINGS_QUERY } from '@/sanity/queries/global';
import type { CONTACT_PAGE_QUERY_RESULT } from '@/sanity/sanity.types';
import type { SiteSettings } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

const STATEMENT_FALLBACK_EN =
  'Let\'s craft your <span class="vp-outline">story</span>.';
const STATEMENT_FALLBACK_ZH =
  '一起讲述你的<span class="vp-outline">故事</span>。';

function whatsappHref(value: string): string {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      className="text-vp-link"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L0 24l6.335-1.662A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.78 9.78 0 01-4.988-1.375l-.357-.214-3.76.987 1.004-3.66-.233-.375A9.818 9.818 0 1112 21.818z" />
    </svg>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const page = await sanityClient.fetch(CONTACT_PAGE_QUERY);
  if (!page) {
    return {
      title: aboutContactPageTitle(
        typedLocale === 'zh' ? '联系' : 'Contact',
        typedLocale,
      ),
    };
  }

  const title = typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/contact',
    zhPath: `/zh/${page.slugZh || '联系'}`,
    title:
      seoMetaTitle(page.seo ?? undefined, typedLocale) ??
      aboutContactPageTitle(title ?? '', typedLocale),
    description: seoDescription(page.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(page.seo ?? undefined, page.featuredImage ?? undefined),
    type: 'website',
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [pageData, siteSettings] = await Promise.all([
    sanityClient.fetch<CONTACT_PAGE_QUERY_RESULT>(CONTACT_PAGE_QUERY),
    sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
  ]);

  if (!pageData) notFound();

  const t = await getTranslations('Contact');

  const statementRaw =
    typedLocale === 'zh' && pageData.heroTitleZh
      ? pageData.heroTitleZh
      : pageData.heroTitle ||
        (typedLocale === 'zh' ? STATEMENT_FALLBACK_ZH : STATEMENT_FALLBACK_EN);
  // NFC for page-local statement that may bypass display-title / phrase resolvers.
  const statementHtml = statementRaw.normalize('NFC');

  const email = siteSettings?.contactEmail?.trim();
  const whatsapp = siteSettings?.contactWhatsapp?.trim();
  const waLink = whatsapp ? whatsappHref(whatsapp) : '';

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs(
          [homeBreadcrumb(typedLocale), contactBreadcrumb(typedLocale)],
          typedLocale,
        )}
      />

      <section className="vp-contact-statement flex min-h-[70vh] items-center justify-center px-4 py-[clamp(6rem,9vw,10rem)] pt-[clamp(8rem,12vw,13rem)]">
        <h1
          className="m-0 max-w-[18ch] text-center font-vp-heading text-[clamp(2.375rem,4.3vw,3.4375rem)] font-bold uppercase leading-tight tracking-vp-heading"
          dangerouslySetInnerHTML={{ __html: statementHtml }}
        />
      </section>

      <SectionWrapper fullBleed={true} className="!pt-0">
        <div className="container-fluid mx-auto max-w-[1400px] px-4">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:gap-8 md:text-left">
            <div className="md:min-w-0 md:flex-1">
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="text-xl font-bold text-vp-link hover:text-vp-link-hover"
                >
                  {email}
                </a>
              ) : null}
            </div>

            <div className="md:flex md:flex-1 md:justify-center">
              {whatsapp && waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base text-vp-link hover:text-vp-link-hover"
                >
                  <WhatsAppIcon />
                  <span>{whatsapp}</span>
                </a>
              ) : null}
            </div>

            <div className="flex justify-center md:flex-1 md:justify-end">
              {siteSettings ? <FooterSocials siteSettings={siteSettings} /> : null}
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper borderTop fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <h2 className="mb-4 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
            {t('campaignBriefHeading')}
          </h2>
          <p className="mb-6 max-w-[700px] font-light leading-relaxed text-vp-text-muted">
            {t('campaignBriefBody')}
          </p>
          <VpButton href="/video-campaign-brief">{t('campaignBriefCta')}</VpButton>
        </div>
      </SectionWrapper>
    </>
  );
}
