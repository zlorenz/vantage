'use client';

/**
 * SearchPageClient — debounced search UI reading ?q= from URL.
 *
 * Portfolio hits reuse the /work?view=grid card chrome. Production Log hits
 * reuse BlogPostGrid / BlogPostCard from /news.
 */

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { BlogPostGrid } from '@/components/blog/BlogPostGrid';
import { PortfolioEntryLink } from '@/components/navigation/PortfolioEntryLink';
import { composeOverlayCopy } from '@/lib/overlay-copy';
import { PortfolioIndexGridHover } from '@/components/portfolio/PortfolioIndexGridHover';
import { phraseRecordToMap } from '@phrase-book';
import {
  resolveEntryDisplayTitleParts,
  resolveEntryDocumentTitle,
} from '@/lib/display-titles';
import { trackInteractionEvent } from '@/lib/interaction-events';
import type { Locale } from '@/i18n/routing';
import type {
  BlogPostCard as BlogPostCardData,
  CategoryTerm,
  DisplayTitlePartsValue,
  SanityImage,
} from '@/types/sanity';
import '@/components/portfolio/portfolio-index-grid.css';

interface SearchResultWithImage {
  _id?: string;
  _type: 'portfolioEntry' | 'blogPost';
  title: string;
  titleZh?: string;
  displayTitleParts?: DisplayTitlePartsValue;
  slug: string;
  slugZh?: string;
  publishedAt?: string;
  featuredImage?: SanityImage;
  excerpt?: string;
  excerptZh?: string;
  bodyText?: string;
  bodyTextZh?: string;
  categories?: CategoryTerm[] | null;
  imageUrl?: string | null;
}

interface SearchPageClientProps {
  locale: Locale;
  phrases?: Record<string, string>;
}

const SEARCH_PAD = 'px-[var(--spacing-vp-gutter,1.875rem)]';
const SEARCH_INSET = `${SEARCH_PAD} mx-auto max-w-[1400px]`;

function toBlogPostCard(item: SearchResultWithImage): BlogPostCardData {
  return {
    _id: item._id || item.slug,
    title: item.title,
    titleZh: item.titleZh,
    slug: item.slug,
    slugZh: item.slugZh,
    publishedAt: item.publishedAt,
    featuredImage: item.featuredImage,
    excerpt: item.excerpt,
    excerptZh: item.excerptZh,
    bodyText: item.bodyText,
    bodyTextZh: item.bodyTextZh,
    categories: item.categories ?? undefined,
  };
}

export function SearchPageClient({ locale, phrases }: SearchPageClientProps) {
  const t = useTranslations('Search');
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
  const deferredQuery = useDeferredValue(query);

  const [results, setResults] = useState<SearchResultWithImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deferredQuery) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(deferredQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { results: SearchResultWithImage[] }) => {
        setResults(data.results ?? []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [deferredQuery]);

  const portfolioResults = results.filter((r) => r._type === 'portfolioEntry');
  const newsPosts = useMemo(
    () =>
      results
        .filter((r) => r._type === 'blogPost')
        .map(toBlogPostCard),
    [results],
  );

  const isPending = loading || query !== deferredQuery;

  const resultsHeading =
    query ? (
      <h1
        className={`mb-8 font-vp-heading text-xl font-bold uppercase leading-tight tracking-vp-heading ${SEARCH_PAD}`}
      >
        <span className="text-white/45">{t('resultsForLabel')}</span>{' '}
        <span className="text-white">{query}</span>
      </h1>
    ) : null;

  if (!query) {
    return (
      <div className={SEARCH_INSET}>
        <h1 className="sr-only">{t('title')}</h1>
        <p className="font-light text-vp-text-muted">{t('hint')}</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div>
        {resultsHeading}
        <div
          className={`vp-load-spinner mx-auto ${SEARCH_INSET}`}
          aria-label={t('loadingAria')}
        />
      </div>
    );
  }

  if (!results.length) {
    return (
      <div>
        {resultsHeading}
        <p
          className={`font-light text-vp-text-muted ${SEARCH_PAD}`}
        >
          {t('noResults', { query })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {resultsHeading}
      {portfolioResults.length > 0 ? (
        <section>
          <h2
            className={`mb-2 font-vp-heading text-[length:var(--vp-display-title-size)] font-bold uppercase leading-[1.15] tracking-[var(--vp-display-title-tracking)] ${SEARCH_PAD}`}
          >
            {t('portfolio')}
          </h2>
          <ul className="vp-portfolio-index__grid">
            {portfolioResults.map((item) => (
              <li
                key={`${item._type}-${item.slug}`}
                className="vp-portfolio-index__grid-item"
              >
                <SearchPortfolioCard
                  item={item}
                  locale={locale}
                  phrases={phrases}
                  query={query}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {newsPosts.length > 0 ? (
        <section>
          <h2
            className={`mb-2 font-vp-heading text-[length:var(--vp-display-title-size)] font-bold uppercase leading-[1.15] tracking-[var(--vp-display-title-tracking)] ${SEARCH_PAD}`}
          >
            {t('news')}
          </h2>
          <BlogPostGrid
            posts={newsPosts}
            locale={locale}
            phrases={phrases}
            onPostNavigate={(post) => {
              const slugParam =
                locale === 'zh' ? post.slugZh || post.slug : post.slug;
              trackInteractionEvent({
                eventType: 'result_click',
                sourceSurface: 'search_page',
                query,
                resultSlug: slugParam,
                resultType: 'news',
              });
            }}
          />
        </section>
      ) : null}
    </div>
  );
}

function SearchPortfolioCard({
  item,
  locale,
  phrases,
  query,
}: {
  item: SearchResultWithImage;
  locale: Locale;
  phrases?: Record<string, string>;
  query: string;
}) {
  const slugParam = locale === 'zh' ? item.slugZh || item.slug : item.slug;
  const phraseMap = phrases ? phraseRecordToMap(phrases) : null;
  const parts = resolveEntryDisplayTitleParts(item, locale, phraseMap);
  const { brandLine, campaignLine } = composeOverlayCopy(parts);
  const campaign =
    campaignLine && campaignLine !== brandLine ? campaignLine : '';
  const fallbackTitle =
    !brandLine && !campaign
      ? resolveEntryDocumentTitle(item, locale, phraseMap)
      : '';
  const campaignText = campaign || fallbackTitle;

  return (
    <PortfolioEntryLink
      slug={slugParam}
      className="vp-portfolio-index__grid-link"
      onClick={() => {
        trackInteractionEvent({
          eventType: 'result_click',
          sourceSurface: 'search_page',
          query,
          resultSlug: slugParam,
          resultType: 'portfolio',
        });
      }}
    >
      <div className="vp-portfolio-index__grid-media">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes="(min-width: 2800px) 25vw, (min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="vp-portfolio-index__grid-poster"
          />
        ) : null}
        {brandLine || campaignText ? (
          <div className="vp-portfolio-index__grid-copy">
            {brandLine ? (
              <p className="vp-portfolio-index__grid-brand">{brandLine}</p>
            ) : null}
            {campaignText ? (
              <p className="vp-portfolio-index__grid-campaign">{campaignText}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <PortfolioIndexGridHover />
    </PortfolioEntryLink>
  );
}
