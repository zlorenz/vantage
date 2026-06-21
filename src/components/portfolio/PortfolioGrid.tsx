'use client';

/**
 * PortfolioGrid — filter bar, client-side filtering, and infinite scroll.
 *
 * Receives all entries as props from SSG parent pages. Filtering and
 * pagination happen in memory — no API calls.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { PortfolioCard } from './PortfolioCard';
import type { Locale } from '@/i18n/routing';
import type {
  ClientTerm,
  CrewMemberTerm,
  PortfolioGridEntry,
  PortfolioInternalGridEntry,
  TaxonomyTerm,
} from '@/types/sanity';

const PER_PAGE = 12;

export type PortfolioFilterMode = 'public' | 'internal';

export interface PublicPresetFilters {
  format?: string;
  industry?: string;
  market?: string;
}

interface PortfolioGridProps {
  locale: Locale;
  entries: PortfolioGridEntry[] | PortfolioInternalGridEntry[];
  filterMode: PortfolioFilterMode;
  videoFormats?: TaxonomyTerm[];
  industries?: TaxonomyTerm[];
  markets?: TaxonomyTerm[];
  clients?: ClientTerm[];
  directors?: CrewMemberTerm[];
  dops?: CrewMemberTerm[];
  artDirectors?: CrewMemberTerm[];
  /** Pre-select taxonomy filters on archive pages. */
  presetFilters?: PublicPresetFilters;
}

interface PublicFilters {
  format: string;
  industry: string;
  market: string;
}

interface InternalFilters {
  client: string;
  director: string;
  dop: string;
  'art-director': string;
}

function termSlug(term: TaxonomyTerm, locale: Locale): string {
  return locale === 'zh' ? term.slugZh || term.slug : term.slug;
}

function termLabel(term: TaxonomyTerm, locale: Locale): string {
  const raw =
    locale === 'zh' && term.titleZh ? term.titleZh : term.title;
  return decodeHtmlEntities(raw);
}

function readPublicFilters(
  params: URLSearchParams,
  preset?: PublicPresetFilters,
): PublicFilters {
  return {
    format: params.get('format') || preset?.format || '',
    industry: params.get('industry') || preset?.industry || '',
    market: params.get('market') || preset?.market || '',
  };
}

function readInternalFilters(params: URLSearchParams): InternalFilters {
  return {
    client: params.get('client') || '',
    director: params.get('director') || '',
    dop: params.get('dop') || '',
    'art-director': params.get('art-director') || '',
  };
}

function matchesPublicFilters(
  entry: PortfolioGridEntry,
  filters: PublicFilters,
): boolean {
  if (filters.format && !entry.videoFormatSlugs?.includes(filters.format)) {
    return false;
  }
  if (filters.industry && !entry.industrySlugs?.includes(filters.industry)) {
    return false;
  }
  if (filters.market && !entry.marketSlugs?.includes(filters.market)) {
    return false;
  }
  return true;
}

function matchesInternalFilters(
  entry: PortfolioInternalGridEntry,
  filters: InternalFilters,
): boolean {
  if (filters.client && !entry.clientSlugs?.includes(filters.client)) {
    return false;
  }
  if (filters.director) {
    const hasDirector = entry.crewMembers?.some(
      (m) => m.role === 'director' && m.slug === filters.director,
    );
    if (!hasDirector) return false;
  }
  if (filters.dop) {
    const hasDop = entry.crewMembers?.some(
      (m) => m.role === 'dop' && m.slug === filters.dop,
    );
    if (!hasDop) return false;
  }
  if (filters['art-director']) {
    const hasArtDirector = entry.crewMembers?.some(
      (m) => m.role === 'art-director' && m.slug === filters['art-director'],
    );
    if (!hasArtDirector) return false;
  }
  return true;
}

function buildPublicQuery(filters: PublicFilters): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.format) query.format = filters.format;
  if (filters.industry) query.industry = filters.industry;
  if (filters.market) query.market = filters.market;
  return query;
}

function buildInternalQuery(filters: InternalFilters): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.client) query.client = filters.client;
  if (filters.director) query.director = filters.director;
  if (filters.dop) query.dop = filters.dop;
  if (filters['art-director']) query['art-director'] = filters['art-director'];
  return query;
}

export function PortfolioGrid({
  locale,
  entries,
  filterMode,
  videoFormats = [],
  industries = [],
  markets = [],
  clients = [],
  directors = [],
  dops = [],
  artDirectors = [],
  presetFilters,
}: PortfolioGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const presetFormat = presetFilters?.format ?? '';
  const presetIndustry = presetFilters?.industry ?? '';
  const presetMarket = presetFilters?.market ?? '';

  const publicFilters = useMemo(
    () =>
      readPublicFilters(searchParams, {
        format: presetFormat || undefined,
        industry: presetIndustry || undefined,
        market: presetMarket || undefined,
      }),
    [searchParams, presetFormat, presetIndustry, presetMarket],
  );
  const internalFilters = useMemo(
    () => readInternalFilters(searchParams),
    [searchParams],
  );

  const filterSignature = [
    publicFilters.format,
    publicFilters.industry,
    publicFilters.market,
    internalFilters.client,
    internalFilters.director,
    internalFilters.dop,
    internalFilters['art-director'],
  ].join('|');

  const filteredEntries = useMemo(() => {
    if (filterMode === 'internal') {
      return (entries as PortfolioInternalGridEntry[]).filter((entry) =>
        matchesInternalFilters(entry, internalFilters),
      );
    }
    return (entries as PortfolioGridEntry[]).filter((entry) =>
      matchesPublicFilters(entry, publicFilters),
    );
  }, [entries, filterMode, internalFilters, publicFilters]);

  const [visibleCount, setVisibleCount] = useState(PER_PAGE);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    setVisibleCount(PER_PAGE);
  }, [filterSignature, entries]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => {
      if (prev >= filteredEntries.length) return prev;
      return Math.min(prev + PER_PAGE, filteredEntries.length);
    });
  }, [filteredEntries.length]);

  // Clear loading flag once the new batch has been committed.
  useEffect(() => {
    loadingRef.current = false;
    setLoading(false);
  }, [visibleCount]);

  // Re-attach observer after each batch so a still-visible sentinel triggers
  // the next load (IntersectionObserver only fires on crossing changes).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (!observerEntries.some((e) => e.isIntersecting)) return;
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        loadMore();
      },
      { rootMargin: '1200px 0px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, visibleCount]);

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updatePublicFilter = (key: keyof PublicFilters, value: string) => {
    const next = { ...publicFilters, [key]: value };
    router.replace(
      {
        pathname,
        params: routeParams,
        query: buildPublicQuery(next),
      } as Parameters<typeof router.replace>[0],
      { scroll: false },
    );
    scrollToGrid();
  };

  const updateInternalFilter = (key: keyof InternalFilters, value: string) => {
    const next = { ...internalFilters, [key]: value };
    router.replace(
      {
        pathname,
        params: routeParams,
        query: buildInternalQuery(next),
      } as Parameters<typeof router.replace>[0],
      { scroll: false },
    );
    scrollToGrid();
  };

  const filterBar = filterMode === 'public' ? (
    <div className="vp-filterbar" aria-label="Portfolio filters">
      <div className="vp-filterbar__inner">
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-format">
            Video Format
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-format"
              className="vp-filterbar__select"
              name="format"
              value={publicFilters.format}
              onChange={(e) => updatePublicFilter('format', e.target.value)}
            >
              <option value="">All</option>
              {videoFormats.map((term) => (
                <option key={term._id} value={termSlug(term, locale)}>
                  {termLabel(term, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-industry">
            Industry
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-industry"
              className="vp-filterbar__select"
              name="industry"
              value={publicFilters.industry}
              onChange={(e) => updatePublicFilter('industry', e.target.value)}
            >
              <option value="">All</option>
              {industries.map((term) => (
                <option key={term._id} value={termSlug(term, locale)}>
                  {termLabel(term, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-market">
            Market
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-market"
              className="vp-filterbar__select"
              name="market"
              value={publicFilters.market}
              onChange={(e) => updatePublicFilter('market', e.target.value)}
            >
              <option value="">All</option>
              {markets.map((term) => (
                <option key={term._id} value={termSlug(term, locale)}>
                  {termLabel(term, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="vp-filterbar" aria-label="Portfolio crew filters">
      <div className="vp-filterbar__inner">
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-client">
            Client
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-client"
              className="vp-filterbar__select"
              name="client"
              value={internalFilters.client}
              onChange={(e) => updateInternalFilter('client', e.target.value)}
            >
              <option value="">All</option>
              {clients.map((client) => (
                <option key={client._id} value={client.slug}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-director">
            Director
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-director"
              className="vp-filterbar__select"
              name="director"
              value={internalFilters.director}
              onChange={(e) => updateInternalFilter('director', e.target.value)}
            >
              <option value="">All</option>
              {directors.map((member) => (
                <option key={member._id} value={member.slug}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-dop">
            DOP
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-dop"
              className="vp-filterbar__select"
              name="dop"
              value={internalFilters.dop}
              onChange={(e) => updateInternalFilter('dop', e.target.value)}
            >
              <option value="">All</option>
              {dops.map((member) => (
                <option key={member._id} value={member.slug}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-art-director">
            Art Director
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-art-director"
              className="vp-filterbar__select"
              name="art-director"
              value={internalFilters['art-director']}
              onChange={(e) =>
                updateInternalFilter('art-director', e.target.value)
              }
            >
              <option value="">All</option>
              {artDirectors.map((member) => (
                <option key={member._id} value={member.slug}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {filterBar}
      {visibleEntries.length > 0 ? (
        <div
          id="vp-portfolio-grid"
          ref={gridRef}
          className="vp-portfolio-gallery"
        >
          {visibleEntries.map((entry, index) => (
            <PortfolioCard
              key={entry._id}
              entry={entry}
              locale={locale}
              revealIndex={index % PER_PAGE}
            />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-vp-text-soft">
          No portfolio items found.
        </p>
      )}
      <div
        id="vp-load-more"
        ref={sentinelRef}
        className={hasMore ? (loading ? 'loading' : '') : 'is-done'}
        aria-hidden={!hasMore}
      >
        {hasMore && loading ? <div className="vp-load-spinner" /> : null}
      </div>
    </>
  );
}
