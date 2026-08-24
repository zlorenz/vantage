/**
 * Contact page — real static page (no modal). Hero + Contact Info (from
 * siteSettings, same fields ContactModal has always shown) + Campaign Brief CTA.
 *
 * Page doc (CONTACT_PAGE_QUERY) supplies hero/SEO fields only; the actual
 * contact details (title, intro, email, WhatsApp, address, body copy, CTA)
 * come from the `siteSettings` singleton via SITE_SETTINGS_QUERY — same
 * source ContactModal has always read, read-only here.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/ui/PageHero';
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
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { getPhraseRecord } from '@/lib/phrase-book';
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

function whatsappHref(value: string): string {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
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

  const [pageData, siteSettings, phrases] = await Promise.all([
    sanityClient.fetch<CONTACT_PAGE_QUERY_RESULT>(CONTACT_PAGE_QUERY),
    sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
    getPhraseRecord(),
  ]);

  if (!pageData) notFound();

  const t = await getTranslations('Contact');

  const heroTitle =
    typedLocale === 'zh' && pageData.heroTitleZh
      ? pageData.heroTitleZh
      : pageData.heroTitle || 'Contact <span class="vp-outline">Us</span>';

  const title =
    pickLocaleFieldWithPhrases(
      typedLocale,
      siteSettings?.contactModalTitle,
      siteSettings?.contactModalTitleZh,
      phrases,
    ).trim() || t('modalTitle');
  const intro = pickLocaleFieldWithPhrases(
    typedLocale,
    siteSettings?.contactModalIntro,
    siteSettings?.contactModalIntroZh,
    phrases,
  ).trim();
  const email = siteSettings?.contactEmail?.trim();
  const whatsapp = siteSettings?.contactWhatsapp?.trim();
  const waLink = whatsapp ? whatsappHref(whatsapp) : '';
  const address = pickLocaleFieldWithPhrases(
    typedLocale,
    siteSettings?.contactAddress,
    siteSettings?.contactAddressZh,
    phrases,
  ).trim();
  const ctaText = pickLocaleFieldWithPhrases(
    typedLocale,
    siteSettings?.contactCtaText,
    siteSettings?.contactCtaTextZh,
    phrases,
  ).trim();
  const ctaUrl = siteSettings?.contactCtaUrl?.trim();
  const bodyContent =
    typedLocale === 'zh' && siteSettings?.contactModalContentZh?.length
      ? siteSettings.contactModalContentZh
      : siteSettings?.contactModalContent;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs(
          [homeBreadcrumb(typedLocale), contactBreadcrumb(typedLocale)],
          typedLocale,
        )}
      />
      <PageHero title={heroTitle} backgroundImage={pageData.featuredImage ?? undefined} />

      <SectionWrapper fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <h2 className="mb-4 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
            {title}
          </h2>

          {intro ? (
            <p className="mb-6 whitespace-pre-wrap font-light leading-relaxed text-vp-text-muted">
              {intro}
            </p>
          ) : null}

          <ul className="mb-6 list-none p-0">
            {email ? (
              <li className="mb-2">
                <h3 className="m-0 text-xl font-bold">
                  <a href={`mailto:${email}`} className="text-vp-link hover:text-vp-link-hover">
                    {email}
                  </a>
                </h3>
              </li>
            ) : null}

            {whatsapp && waLink ? (
              <li className="mb-1">
                <span className="mr-1 inline-block align-middle" aria-hidden>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="currentColor"
                    className="text-vp-link"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L0 24l6.335-1.662A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.78 9.78 0 01-4.988-1.375l-.357-.214-3.76.987 1.004-3.66-.233-.375A9.818 9.818 0 1112 21.818z" />
                  </svg>
                </span>
                <h5 className="inline text-base font-normal">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vp-link hover:text-vp-link-hover"
                  >
                    {whatsapp}
                  </a>
                </h5>
              </li>
            ) : null}
          </ul>

          {address ? (
            <address className="m-0 mb-6 text-base font-normal not-italic leading-snug">
              {address.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < address.split('\n').length - 1 ? <br /> : null}
                </span>
              ))}
            </address>
          ) : null}

          {bodyContent?.length ? (
            <div className="mb-6 prose prose-invert max-w-none font-light">
              {/* Known NFC gap (matches ContactModal): raw PortableText, not PortableTextContent. */}
              <PortableText
                value={bodyContent as unknown as Parameters<typeof PortableText>[0]['value']}
              />
            </div>
          ) : null}

          {ctaText && ctaUrl ? (
            <p className="m-0">
              <a href={ctaUrl} className="font-bold uppercase text-vp-link hover:text-vp-link-hover">
                {ctaText}
              </a>
            </p>
          ) : null}
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
