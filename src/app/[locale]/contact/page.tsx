/**
 * Contact page — desktop Figma 2602:33639, mobile Figma 2602:29604.
 * Desktop product tweaks carry to mobile where they still make sense:
 * no contact icons, no crosshair, no outer hero brackets, centered
 * title+contact cluster, wider title–contact gap, bottom hairline.
 *
 * Statement copy is page-local. Contact details come from siteSettings.
 * Page doc still supplies SEO / notFound via CONTACT_PAGE_QUERY.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CornerFrame } from '@/components/ui/CornerFrame';
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
import '@/components/about/about-tokens.css';
import './contact-page.css';

type Props = {
  params: Promise<{ locale: string }>;
};

/** Explicit line breaks. Spaces between the spans keep soft wrap as one sentence. */
const STATEMENT_EN = "Let's Craft\nYour Next\nCampaign";
const STATEMENT_EN_LINES = STATEMENT_EN.split('\n');
/** First line stays white; the rest use brand orange. */
const STATEMENT_EN_ACCENT_FROM = 1;
const STATEMENT_ZH = '一起打造你的下一个广告战役';

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

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs(
          [homeBreadcrumb(typedLocale), contactBreadcrumb(typedLocale)],
          typedLocale,
        )}
      />

      <section className="vp-contact-hero">
        {/*
          Title + contact form one cluster, centered under the nav.
          Mobile stacks contact cells; desktop puts them in a row.
        */}
        <div className="vp-contact-hero__cluster">
          <div className="vp-contact-hero__title-slot">
            <h1 className="vp-contact-hero__title">
              {typedLocale === 'zh'
                ? STATEMENT_ZH
                : STATEMENT_EN_LINES.map((line, index) => (
                    <span
                      key={line}
                      className={
                        index >= STATEMENT_EN_ACCENT_FROM
                          ? 'vp-contact-hero__line vp-contact-hero__line--accent'
                          : 'vp-contact-hero__line'
                      }
                    >
                      {line}
                      {index < STATEMENT_EN_LINES.length - 1 ? ' ' : null}
                    </span>
                  ))}
            </h1>
          </div>
          <div className="vp-contact-hero__card">
            {email ? (
              <a href={`mailto:${email}`} className="vp-contact-hero__cell">
                <CornerFrame />
                <span className="vp-contact-hero__contact">{email}</span>
              </a>
            ) : null}
            {phone && phoneLink ? (
              <a href={phoneLink} className="vp-contact-hero__cell">
                <CornerFrame />
                <span className="vp-contact-hero__contact">{phone}</span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="vp-contact-hero__stage" aria-hidden="true">
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
      </section>

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
              showBrackets={false}
              rulers={{ top: true, bottom: true }}
            />
          </div>
          <div className="vp-contact-cta__inner">
            <div className="vp-contact-cta__copy">
              <h2 className="vp-contact-cta__heading">{t('campaignBriefHeading')}</h2>
              <p className="vp-contact-cta__body">{t('campaignBriefBody')}</p>
            </div>
            <VpButton href="/video-campaign-brief">
              {t('campaignBriefCta')}
              <svg
                viewBox="0 0 18 18"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M4.2 12.9 11.4 5.7H6.75V4.2H14.1v7.35h-1.5V6.9L5.4 14.1z"
                />
              </svg>
            </VpButton>
          </div>
        </div>
      </section>
    </>
  );
}
