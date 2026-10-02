/**
 * Contact page — full-viewport brand-orange statement + bottom contact bar
 * (email / WhatsApp / socials from siteSettings) + Campaign Brief CTA.
 *
 * Statement copy is page-local for the redesign (outline treatment retired).
 * Contact details come from the `siteSettings` singleton via SITE_SETTINGS_QUERY.
 * Page doc still supplies SEO / notFound via CONTACT_PAGE_QUERY.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FooterSocials } from '@/components/layout/SiteFooter';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { VpButton } from '@/components/ui/VpButton';
import { Link } from '@/i18n/navigation';
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
import '@/components/about/about-tokens.css';
import './contact-page.css';

type Props = {
  params: Promise<{ locale: string }>;
};

/** Explicit desktop line breaks. Spaces between the spans keep mobile wrap as one sentence. */
const STATEMENT_EN = "Let's Craft\nYour Next\nCampaign";
const STATEMENT_EN_LINES = STATEMENT_EN.split('\n');
const STATEMENT_ZH = '一起打造你的下一个广告战役';

/** text-xl (1.25rem) + 25% → 1.5625rem */
const CONTACT_LINK_CLASS =
  'text-[1.5625rem] font-bold text-black no-underline transition-opacity duration-vp-default hover:opacity-70';

const SOCIAL_LINK_CLASS =
  'inline-flex text-black transition-opacity duration-vp-default hover:opacity-70';

function whatsappHref(value: string): string {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

function telHref(value: string): string {
  return `tel:${value.replace(/\s+/g, '')}`;
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

  const email = siteSettings?.contactEmail?.trim();
  const phone = siteSettings?.contactPhone?.trim();
  const phoneLink = phone ? telHref(phone) : '';
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

      <section className="vp-contact-hero relative flex min-h-svh flex-col bg-vp-orange text-black">
        {/*
          Mobile: absolutely centered, max-w 16ch, natural wrap.
          Desktop (contact-page.css, min-width 768px): normal flow, three
          explicit EN lines, 120px / 0.9 at 1920. ZH stays one string and wraps.
        */}
        <div className="vp-contact-hero__title-slot pointer-events-none absolute inset-0 flex items-center justify-center px-4">
          <h1 className="vp-contact-hero__title pointer-events-auto m-0 max-w-[16ch] text-center font-vp-heading text-[clamp(2.75rem,8vw,7.5rem)] font-bold uppercase leading-[0.74] tracking-normal text-black">
            {typedLocale === 'zh'
              ? STATEMENT_ZH
              : STATEMENT_EN_LINES.map((line, index) => (
                  <span key={line} className="vp-contact-hero__line">
                    {line}
                    {index < STATEMENT_EN_LINES.length - 1 ? ' ' : null}
                  </span>
                ))}
          </h1>
        </div>

        <div className="vp-contact-hero__stage">
          <div className="vp-contact-hero__brackets">
            <CornerFrame variant="light" />
          </div>
          <div className="vp-contact-hero__media">
            <Image
              src="/brand/contact/vantage-contact-hero.png"
              alt=""
              width={596}
              height={720}
              className="vp-contact-hero__photo"
              priority
            />
            <span className="vp-contact-hero__crosshair" aria-hidden="true" />
          </div>
          <div className="vp-contact-hero__details">
            {email ? (
              <a href={`mailto:${email}`} className="vp-contact-hero__contact">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/contact/icon-mail.svg" alt="" width={32} height={32} />
                <span>{email}</span>
              </a>
            ) : null}
            {phone && phoneLink ? (
              <a href={phoneLink} className="vp-contact-hero__contact vp-contact-hero__contact--phone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/contact/icon-phone.svg" alt="" width={28} height={28} />
                <span>{phone}</span>
              </a>
            ) : null}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="vp-contact-hero__mark vp-contact-hero__mark--left"
            src="/brand/contact/corner-mark-left.svg"
            alt=""
            width={327}
            height={171}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="vp-contact-hero__mark vp-contact-hero__mark--right"
            src="/brand/contact/corner-mark-right.svg"
            alt=""
            width={327}
            height={171}
          />
        </div>

        <div className="vp-contact-hero__bar relative z-[1] mt-auto shrink-0 px-4 pb-[clamp(2rem,4vw,3.5rem)] pt-4">
          <div className="container-fluid mx-auto max-w-[1400px]">
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:gap-8 md:text-left">
              <div className="md:min-w-0 md:flex-1">
                {email ? (
                  <a href={`mailto:${email}`} className={CONTACT_LINK_CLASS}>
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
                    className={CONTACT_LINK_CLASS}
                  >
                    {whatsapp}
                  </a>
                ) : null}
              </div>

              <div className="flex justify-center md:flex-1 md:justify-end">
                {siteSettings ? (
                  <FooterSocials
                    siteSettings={siteSettings}
                    linkClassName={SOCIAL_LINK_CLASS}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vp-contact-cta-legacy">
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
      </div>

      <section className="vp-contact-cta">
        <div className="vp-contact-cta__frame">
          <svg className="vp-contact-cta__dash" aria-hidden="true">
            <rect />
          </svg>
          <span className="vp-contact-cta__corner vp-contact-cta__corner--tl" />
          <span className="vp-contact-cta__corner vp-contact-cta__corner--tr" />
          <span className="vp-contact-cta__corner vp-contact-cta__corner--bl" />
          <span className="vp-contact-cta__corner vp-contact-cta__corner--br" />
          <div className="vp-contact-cta__rulers">
            <CornerFrame
              variant="dark"
              showBrackets={false}
              rulers={{ top: true, bottom: true, labels: true }}
            />
          </div>
          <div className="vp-contact-cta__inner">
            <div className="vp-contact-cta__copy">
              <h2 className="vp-contact-cta__heading">{t('campaignBriefHeading')}</h2>
              <p className="vp-contact-cta__body">{t('campaignBriefBody')}</p>
            </div>
            <Link href="/video-campaign-brief" className="vp-contact-cta__button">
              {t('campaignBriefCta')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
