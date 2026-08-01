/**
 * JSON-LD structured data builders for schema.org.
 * Returns plain objects — callers render via <JsonLd />.
 */

import { stegaClean } from '@sanity/client/stega';
import type { SanityImageSource } from '@sanity/image-url';
import type { Locale } from '@/i18n/routing';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { sanityClient, urlForImage } from '@/lib/sanity';
import {
  absoluteUrl,
  blogPostPaths,
  industryPaths,
  marketPaths,
  portfolioPaths,
  videoFormatPaths,
} from '@/lib/sitemap-urls';
import { parseVideoUrl } from '@/lib/video-url';
import { ORGANIZATION_SCHEMA_DATA_QUERY } from '@/sanity/queries/global';
import type { CrewCredit, SanityImage, SeoFields } from '@/types/sanity';

const ORGANIZATION_ID = 'https://vantage.pictures/#organization';
const WEBSITE_ID = 'https://vantage.pictures/#website';
const ORGANIZATION_LOGO = {
  '@type': 'ImageObject' as const,
  url: 'https://vantage.pictures/brand/vantage-logo-512.png',
  width: 512,
  height: 512,
};

const OFFICE_ADDRESS = {
  '@type': 'PostalAddress' as const,
  streetAddress: '67/26 Hoàng Hoa Thám, Gia Định',
  addressLocality: 'Ho Chi Minh City',
  addressCountry: 'VN',
};

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface VideoObjectInput {
  title: string;
  description?: string;
  featuredImage?: SanityImage;
  publishedAt?: string;
  vimeoUrl: string;
  locale?: Locale;
  crewCredits?: CrewCredit[];
}

export interface ArticleInput {
  title: string;
  excerpt?: string;
  excerptZh?: string;
  featuredImage?: SanityImage;
  publishedAt?: string;
  _updatedAt?: string;
  seo?: SeoFields;
  locale?: Locale;
}

export interface OrganizationFounderInput {
  name?: string | null;
  jobTitle?: string | null;
  jobTitleZh?: string | null;
  professionalTitle?: string | null;
  professionalTitleZh?: string | null;
  image?: SanityImageSource | null;
  bio?: string | null;
  bioZh?: string | null;
  sameAs?: Array<string | null> | null;
}

export interface OrganizationSchemaInput {
  locale: Locale;
  legalName?: string | null;
  foundingDate?: string | null;
  numberOfEmployees?: {
    minValue?: number | null;
    maxValue?: number | null;
  } | null;
  telephone?: string | null;
  areaServed?: string[];
  knowsAbout?: string[];
  /** About page only — omit on other routes. */
  founders?: OrganizationFounderInput[] | null;
}

type OrganizationSchemaDataQueryResult = {
  settings?: {
    legalName?: string | null;
    foundingDate?: string | null;
    numberOfEmployees?: {
      minValue?: number | null;
      maxValue?: number | null;
    } | null;
    contactPhone?: string | null;
  } | null;
  markets?: Array<{ title?: string | null }>;
  industries?: Array<{ title?: string | null }>;
  videoFormats?: Array<{ title?: string | null }>;
};

function schemaLanguage(locale: Locale): 'zh' | 'en' {
  return locale === 'zh' ? 'zh' : 'en';
}

function nonEmptyStrings(values: Array<string | null | undefined> | undefined): string[] {
  if (!values?.length) return [];
  return values
    .map((value) => (value == null ? '' : stegaClean(value).trim()))
    .filter(Boolean);
}

/** Fetch siteSettings org fields + taxonomy titles for JSON-LD (non-stega client). */
export async function loadOrganizationSchemaInput(
  locale: Locale,
): Promise<OrganizationSchemaInput> {
  const data = await sanityClient.fetch<OrganizationSchemaDataQueryResult>(
    ORGANIZATION_SCHEMA_DATA_QUERY,
  );
  const industryTitles = nonEmptyStrings(data.industries?.map((item) => item.title));
  const formatTitles = nonEmptyStrings(data.videoFormats?.map((item) => item.title));

  return {
    locale,
    legalName: data.settings?.legalName,
    foundingDate: data.settings?.foundingDate,
    numberOfEmployees: data.settings?.numberOfEmployees,
    telephone: data.settings?.contactPhone,
    areaServed: nonEmptyStrings(data.markets?.map((item) => item.title)),
    knowsAbout: [...industryTitles, ...formatTitles],
  };
}

/** Strip draft-mode stega, then HTML → plain text for JSON-LD string fields. */
function plainTextDescription(value?: string): string | undefined {
  if (value == null) return undefined;
  const cleaned = stegaClean(value);
  if (!cleaned.trim()) return undefined;
  return decodeHtmlEntities(cleaned.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function articleSchemaDescription(post: ArticleInput): string | undefined {
  const locale = post.locale ?? 'en';
  if (locale === 'zh') {
    const fromSeoZh = plainTextDescription(post.seo?.metaDescriptionZh);
    if (fromSeoZh) return fromSeoZh;
    const fromExcerptZh = plainTextDescription(post.excerptZh);
    if (fromExcerptZh) {
      return fromExcerptZh.length > 300
        ? fromExcerptZh.slice(0, 300).trim()
        : fromExcerptZh;
    }
  }

  const fromSeo = plainTextDescription(post.seo?.metaDescription);
  if (fromSeo) return fromSeo;

  const fromExcerpt = plainTextDescription(post.excerpt);
  if (!fromExcerpt) return undefined;
  return fromExcerpt.length > 300 ? fromExcerpt.slice(0, 300).trim() : fromExcerpt;
}

function videoEmbedUrl(videoUrl: string): string | undefined {
  const parsed = parseVideoUrl(videoUrl);
  if (!parsed) return undefined;
  if (parsed.provider === 'youtube') {
    return `https://www.youtube.com/embed/${parsed.id}`;
  }
  return `https://player.vimeo.com/video/${parsed.id}`;
}

export function homeBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '主页' : 'Home',
    url: locale === 'zh' ? '/zh/' : '/',
  };
}

export function workBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '作品' : 'Work',
    url: locale === 'zh' ? '/zh/工作' : '/work',
  };
}

export function newsBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '新闻动态' : 'News',
    url: locale === 'zh' ? '/zh/新闻' : '/news',
  };
}

export function aboutBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '关于我们' : 'About',
    url: locale === 'zh' ? '/zh/关于' : '/about',
  };
}

export function contactBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '联系' : 'Contact',
    url: locale === 'zh' ? '/zh/联系' : '/contact',
  };
}

export function searchBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '搜索' : 'Search',
    url: locale === 'zh' ? '/zh/search' : '/search',
  };
}

export function portfolioPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = portfolioPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function blogPostPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = blogPostPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function videoFormatPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = videoFormatPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function industryPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = industryPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function marketPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = marketPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function categoryPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const zhSlug = slugZh || slug;
  return locale === 'zh' ? `/zh/类别/${zhSlug}` : `/category/${slug}`;
}

export function staticPageUrl(
  locale: Locale,
  enPath: string,
  zhPath: string,
): string {
  return locale === 'zh' ? zhPath : enPath;
}

function organizationFounderPersons(
  founders: OrganizationFounderInput[] | null | undefined,
  locale: Locale,
) {
  if (!founders?.length) return undefined;

  const people = founders.flatMap((founder) => {
    const name = founder.name == null ? '' : stegaClean(founder.name).trim();
    if (!name) return [];

    const professionalTitleRaw =
      locale === 'zh' && founder.professionalTitleZh?.trim()
        ? founder.professionalTitleZh
        : founder.professionalTitle;
    const professionalTitle =
      professionalTitleRaw == null
        ? undefined
        : stegaClean(professionalTitleRaw).trim() || undefined;

    const internalTitleRaw =
      locale === 'zh' && founder.jobTitleZh?.trim()
        ? founder.jobTitleZh
        : founder.jobTitle;
    const internalTitle =
      internalTitleRaw == null
        ? undefined
        : stegaClean(internalTitleRaw).trim() || undefined;

    const jobTitle = professionalTitle || internalTitle;

    const bioRaw =
      locale === 'zh' && founder.bioZh?.trim() ? founder.bioZh : founder.bio;
    const description =
      bioRaw == null ? undefined : stegaClean(bioRaw).trim() || undefined;

    const image = founder.image
      ? urlForImage(founder.image).width(600).height(750).fit('crop').url()
      : undefined;

    const sameAs = nonEmptyStrings(founder.sameAs ?? undefined);

    return [
      {
        '@type': 'Person' as const,
        name,
        ...(jobTitle ? { jobTitle } : {}),
        ...(image ? { image } : {}),
        ...(description ? { description } : {}),
        ...(sameAs.length ? { sameAs } : {}),
      },
    ];
  });

  return people.length ? people : undefined;
}

export function buildOrganization(input: OrganizationSchemaInput) {
  const legalName = input.legalName?.trim()
    ? stegaClean(input.legalName).trim()
    : undefined;
  const foundingDate = input.foundingDate?.trim()
    ? stegaClean(input.foundingDate).trim()
    : undefined;
  const telephone = input.telephone?.trim()
    ? stegaClean(input.telephone).trim()
    : undefined;

  const minValue = input.numberOfEmployees?.minValue;
  const maxValue = input.numberOfEmployees?.maxValue;
  const numberOfEmployees =
    typeof minValue === 'number' || typeof maxValue === 'number'
      ? {
          '@type': 'QuantitativeValue' as const,
          ...(typeof minValue === 'number' ? { minValue } : {}),
          ...(typeof maxValue === 'number' ? { maxValue } : {}),
        }
      : undefined;

  const areaServed = input.areaServed?.length ? input.areaServed : undefined;
  const knowsAbout = input.knowsAbout?.length ? input.knowsAbout : undefined;
  const founder = organizationFounderPersons(input.founders, input.locale);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'Vantage Pictures',
        url: 'https://vantage.pictures',
        logo: ORGANIZATION_LOGO,
        description:
          'Vietnam-based commercial video production company specialising in brand films, product commercials, and social media campaigns for global brands.',
        email: 'info@vantage.pictures',
        ...(legalName ? { legalName } : {}),
        ...(foundingDate ? { foundingDate } : {}),
        ...(numberOfEmployees ? { numberOfEmployees } : {}),
        ...(telephone ? { telephone } : {}),
        ...(areaServed ? { areaServed } : {}),
        ...(knowsAbout ? { knowsAbout } : {}),
        ...(founder ? { founder } : {}),
        address: OFFICE_ADDRESS,
        sameAs: [
          'https://www.facebook.com/vantagepictures',
          'https://www.instagram.com/vantage.pictures/',
          'https://www.linkedin.com/company/vantage-pictures',
          'https://www.youtube.com/@vantage.pictures',
          'https://vimeo.com/vantagepictures',
          'https://www.xinpianchang.com/u11835825',
          'https://www.xiaohongshu.com/user/profile/6666abf600000000070055ff',
          'https://www.google.com/maps/place/Vantage+Pictures/@10.8060001,106.6894896,17z/data=!3m1!4b1!4m6!3m5!1s0x3175299a0d905493:0xffc4e5df7607c582!8m2!3d10.8060001!4d106.6894896!16sg11fv4j_y8d',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: 'https://vantage.pictures',
        name: 'Vantage Pictures',
        inLanguage: schemaLanguage(input.locale),
        publisher: { '@id': ORGANIZATION_ID },
      },
    ],
  };
}

type SchemaPerson = {
  '@type': 'Person';
  name: string;
  jobTitle?: string;
};

type SchemaOrganization = {
  '@type': 'Organization';
  name: string;
  jobTitle?: string;
};

type SchemaContributor = SchemaPerson | SchemaOrganization;

const VIDEO_OBJECT_NAMED_ROLE_KEYS = new Set(['director', 'producer', 'editor']);

/**
 * Catalog roleKeys that credit companies/vendors, not individuals.
 * No company/person flag exists on CrewRoleDefinition — this set is explicit.
 * Excludes mixed roles (e.g. catering, transport) where live names are often people.
 */
const VIDEO_OBJECT_ORGANIZATION_ROLE_KEYS = new Set([
  'brand',
  'agency',
  'production_company',
  'production_service',
  'post_house',
  'rental_house',
]);

/** identityName ?? name — matches PORTFOLIO_CREDITS_FIELDS resolved display name. */
function crewPersonSchemaName(person: {
  name?: string;
  identityName?: string;
}): string | undefined {
  const raw = person.identityName ?? person.name;
  if (raw == null) return undefined;
  const cleaned = stegaClean(raw).trim();
  return cleaned || undefined;
}

function peopleFromRoleRows(
  credits: CrewCredit[],
  roleKey: string,
): SchemaPerson[] {
  const people: SchemaPerson[] = [];
  for (const row of credits) {
    if (row.roleKey !== roleKey) continue;
    for (const person of row.people ?? []) {
      const name = crewPersonSchemaName(person);
      if (!name) continue;
      people.push({ '@type': 'Person', name });
    }
  }
  return people;
}

/** Single Person when one; array when multiple; undefined when empty. */
function personOrPeople(people: SchemaPerson[]): SchemaPerson | SchemaPerson[] | undefined {
  if (people.length === 0) return undefined;
  if (people.length === 1) return people[0];
  return people;
}

function videoObjectCrewFields(credits: CrewCredit[] | undefined): {
  director?: SchemaPerson | SchemaPerson[];
  creator?: SchemaPerson | SchemaPerson[];
  producer?: SchemaPerson[];
  editor?: SchemaPerson | SchemaPerson[];
  contributor?: SchemaContributor[];
} {
  if (!credits?.length) return {};

  const directorPeople = peopleFromRoleRows(credits, 'director');
  const director = personOrPeople(directorPeople);
  const producerPeople = peopleFromRoleRows(credits, 'producer');
  const editor = personOrPeople(peopleFromRoleRows(credits, 'editor'));

  const contributor: SchemaContributor[] = [];
  for (const row of credits) {
    if (row.roleKey && VIDEO_OBJECT_NAMED_ROLE_KEYS.has(row.roleKey)) continue;
    const jobTitleRaw = row.role == null ? '' : stegaClean(row.role).trim();
    const jobTitle = jobTitleRaw || undefined;
    const asOrganization = Boolean(
      row.roleKey && VIDEO_OBJECT_ORGANIZATION_ROLE_KEYS.has(row.roleKey),
    );
    for (const person of row.people ?? []) {
      const name = crewPersonSchemaName(person);
      if (!name) continue;
      contributor.push(
        asOrganization
          ? {
              '@type': 'Organization',
              name,
              ...(jobTitle ? { jobTitle } : {}),
            }
          : {
              '@type': 'Person',
              name,
              ...(jobTitle ? { jobTitle } : {}),
            },
      );
    }
  }

  return {
    ...(director ? { director, creator: director } : {}),
    ...(producerPeople.length ? { producer: producerPeople } : {}),
    ...(editor ? { editor } : {}),
    ...(contributor.length ? { contributor } : {}),
  };
}

export function buildVideoObject(entry: VideoObjectInput) {
  const embedUrl = videoEmbedUrl(entry.vimeoUrl);
  const thumbnailUrl = entry.featuredImage
    ? urlForImage(entry.featuredImage).width(1280).height(720).fit('crop').url()
    : undefined;
  const locale = entry.locale ?? 'en';
  const crew = videoObjectCrewFields(entry.crewCredits);

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: stegaClean(entry.title),
    description: plainTextDescription(entry.description),
    thumbnailUrl,
    uploadDate: entry.publishedAt,
    embedUrl,
    inLanguage: schemaLanguage(locale),
    publisher: { '@id': ORGANIZATION_ID },
    ...crew,
  };
}

export function buildArticle(post: ArticleInput) {
  const description = articleSchemaDescription(post);
  const image = post.featuredImage
    ? urlForImage(post.featuredImage).width(1200).height(630).fit('crop').url()
    : undefined;
  const locale = post.locale ?? 'en';

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: stegaClean(post.title),
    description,
    image,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt ?? post.publishedAt,
    inLanguage: schemaLanguage(locale),
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function buildBreadcrumbs(items: BreadcrumbItem[], locale?: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    ...(locale ? { inLanguage: schemaLanguage(locale) } : {}),
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      // stegaClean is a no-op on hardcoded labels; required for CMS-sourced titles.
      name: stegaClean(item.name),
      item: absoluteUrl(item.url),
    })),
  };
}

export interface CollectionPageInput {
  name: string;
  description?: string;
  image?: SanityImageSource | null;
  url: string;
  locale?: Locale;
}

export function buildCollectionPage(input: CollectionPageInput) {
  const name = plainTextDescription(input.name) ?? stegaClean(input.name).trim();
  const description = plainTextDescription(input.description);
  const image = input.image
    ? urlForImage(input.image).width(1200).height(630).fit('crop').url()
    : undefined;
  const locale = input.locale ?? 'en';

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    url: absoluteUrl(input.url),
    inLanguage: schemaLanguage(locale),
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export function buildProfessionalService(input: OrganizationSchemaInput) {
  const areaServed = input.areaServed?.length ? input.areaServed : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Vantage Pictures',
    url: 'https://vantage.pictures',
    serviceType: 'Commercial Video Production',
    ...(areaServed ? { areaServed } : {}),
    inLanguage: schemaLanguage(input.locale),
    address: OFFICE_ADDRESS,
  };
}
