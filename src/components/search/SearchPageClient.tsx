'use client';

/**
 * SearchPageClient — debounced search UI reading ?q= from URL.
 *
 * Fetches results via /api/search (server-side Sanity query).
 */

import { useDeferredValue, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

interface SearchResultWithImage {
  _type: 'portfolioEntry' | 'blogPost';
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  excerpt?: string;
  imageUrl?: string | null;
}

interface SearchPageClientProps {
  locale: Locale;
}

export function SearchPageClient({ locale }: SearchPageClientProps) {
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
  const newsResults = results.filter((r) => r._type === 'blogPost');

  const isPending = loading || query !== deferredQuery;

  if (!query) {
    return (
      <p className="font-light text-vp-text-muted">
        {locale === 'zh' ? '请输入搜索词。' : 'Enter a search term above.'}
      </p>
    );
  }

  if (isPending) {
    return <div className="vp-load-spinner mx-auto" aria-label="Loading search results" />;
  }

  if (!results.length) {
    return (
      <h2 className="vp-search-empty__title text-[clamp(2rem,4vw,3.5rem)] font-bold uppercase leading-tight">
        {locale === 'zh' ? `未找到"${query}"的相关结果` : `No results for '${query}'`}
      </h2>
    );
  }

  return (
    <div className="space-y-12">
      {portfolioResults.length > 0 ? (
        <section>
          <h2 className="mb-6 text-xl font-bold uppercase tracking-vp-uppercase">PORTFOLIO</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioResults.map((item) => (
              <SearchCard key={`${item._type}-${item.slug}`} item={item} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {newsResults.length > 0 ? (
        <section>
          <h2 className="mb-6 text-xl font-bold uppercase tracking-vp-uppercase">NEWS</h2>
          <div className="flex flex-col gap-12">
            {newsResults.map((item) => (
              <SearchNewsCard key={`${item._type}-${item.slug}`} item={item} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SearchCard({ item, locale }: { item: SearchResultWithImage; locale: Locale }) {
  const slugParam = locale === 'zh' ? item.slugZh || item.slug : item.slug;
  const title = locale === 'zh' && item.titleZh ? item.titleZh : item.title;

  return (
    <article className="vp-card vp-card-reveal">
      <Link
        href={{ pathname: '/portfolio/[slug]', params: { slug: slugParam } }}
        className="vp-card__link block text-white no-underline"
      >
        <div className="vp-card__media relative aspect-video w-full overflow-hidden">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="33vw" />
          ) : null}
          <div className="vp-card__overlay" aria-hidden />
          <h3 className="vp-card__title">{title}</h3>
        </div>
      </Link>
    </article>
  );
}

function SearchNewsCard({ item, locale }: { item: SearchResultWithImage; locale: Locale }) {
  const slugParam = locale === 'zh' ? item.slugZh || item.slug : item.slug;
  const title = locale === 'zh' && item.titleZh ? item.titleZh : item.title;

  return (
    <article className="vp-post-card">
      {item.imageUrl ? (
        <Link
          href={{ pathname: '/[slug]', params: { slug: slugParam } }}
          className="vp-post-card__thumb block aspect-video overflow-hidden bg-vp-search-thumb-bg"
        >
          <Image src={item.imageUrl} alt="" width={960} height={540} className="h-full w-full object-cover" />
        </Link>
      ) : null}
      <div className="vp-post-card__body">
        <h2 className="vp-post-card__title m-0 mb-1 text-[clamp(1.4rem,2vw,2.25rem)] font-bold uppercase leading-tight">
          <Link
            href={{ pathname: '/[slug]', params: { slug: slugParam } }}
            className="text-inherit no-underline hover:opacity-80"
          >
            {title}
          </Link>
        </h2>
        {item.excerpt ? (
          <p className="m-0 line-clamp-3 font-light text-vp-text-muted">{item.excerpt}</p>
        ) : null}
      </div>
    </article>
  );
}
