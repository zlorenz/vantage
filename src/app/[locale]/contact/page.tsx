/**
 * Contact page — opens the global ContactModal on mount.
 */

import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import {
  aboutContactPageTitle,
  buildOgImage,
  buildPageMetadata,
  seoDescription,
} from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import { PAGE_BY_SLUG_QUERY } from '@/sanity/queries/pages';
import type { PageDocument } from '@/types/sanity';
import { ContactPageClient } from './ContactPageClient';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = await sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, {
    slug: 'contact',
  });
  if (!page) {
    return {
      title: aboutContactPageTitle(
        locale === 'zh' ? '联系' : 'Contact',
        locale as Locale,
      ),
    };
  }

  const title = locale === 'zh' && page.titleZh ? page.titleZh : page.title;

  return buildPageMetadata({
    locale: locale as Locale,
    enPath: '/contact',
    zhPath: `/zh/${page.slugZh || '联系'}`,
    title: aboutContactPageTitle(title, locale as Locale),
    description: seoDescription(page.seo, locale as Locale),
    image: buildOgImage(page.featuredImage),
    type: 'website',
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ContactPageClient />;
}
