/**
 * About page — hero, who we are, team grid, CTA.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { FounderCard } from '@/components/about/FounderCard';
import { CtaSection } from '@/components/ui/CtaSection';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { pageTitle, seoDescription, buildOgImage, buildPageMetadata } from '@/lib/metadata';
import { filterAboutBodyBlocks } from '@/lib/about-content';
import { sanityClient } from '@/lib/sanity';
import {
  aboutBreadcrumb,
  buildBreadcrumbs,
  buildProfessionalService,
  homeBreadcrumb,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { PAGE_BY_SLUG_QUERY } from '@/sanity/queries/pages';
import type { PageDocument } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = await sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, {
    slug: 'about',
  });
  if (!page) return { title: 'Not Found' };

  const title = locale === 'zh' && page.titleZh ? page.titleZh : page.title;
  const metaTitle = pageTitle(title);

  return buildPageMetadata({
    locale: locale as Locale,
    enPath: '/about',
    zhPath: `/zh/${page.slugZh || '关于'}`,
    title: metaTitle,
    description: seoDescription(page.seo, locale as Locale),
    image: buildOgImage(page.featuredImage),
    type: 'website',
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const page = await sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, {
    slug: 'about',
  });

  if (!page) notFound();

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle || 'About <span class="vp-outline">Us</span>';

  const bodyBlocks = filterAboutBodyBlocks(
    typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body,
    page.founders?.map((founder) => founder.name) ?? []
  );

  const pageTitleLabel =
    typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;

  return (
    <>
      <JsonLd data={buildProfessionalService()} />
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          { name: pageTitleLabel, url: aboutBreadcrumb(typedLocale).url },
        ])}
      />
      <PageHero title={heroTitle} backgroundImage={page.featuredImage} />

      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[800px] px-3 md:px-4">
          <PortableTextContent blocks={bodyBlocks} />
        </div>
      </SectionWrapper>

      {page.founders?.length ? (
        <SectionWrapper borderTop>
          <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
            <h2 className="mb-10 text-center text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase tracking-vp-heading">
              <span className="vp-outline">OUR</span> TEAM
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {page.founders.map((founder) => (
                <FounderCard key={founder.name} founder={founder} />
              ))}
            </div>
          </div>
        </SectionWrapper>
      ) : null}

      <CtaSection locale={typedLocale} />
    </>
  );
}
