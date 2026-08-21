'use client';

/**
 * PortfolioGrid — filter bar, client-side filtering, and infinite scroll.
 *
 * Receives all entries as props from SSG parent pages. Filtering and
 * pagination happen in memory — no API calls.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { flattenTaxonomyTree, optionIndent } from '@/lib/taxonomy-tree';
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
  /** Exact EN→ZH phrase book for card titles and filter labels. */
  phrases?: Record<string, string>;
}

export interface PublicFilters {
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

function termLabel(
  term: TaxonomyTerm,
  locale: Locale,
  phrases?: Record<string, string>,
): string {
  const raw = pickLocaleFieldWithPhrases(
    locale,
    term.title,
    term.titleZh,
    phrases,
  );
  return decodeHtmlEntities(raw);
}

export function readPublicFilters(
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

export function matchesPublicFilters(
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

/** Count entries matching when a given public filter key is set to `value`. */
export function countForPublicFilterValue(
  entries: PortfolioGridEntry[],
  filters: PublicFilters,
  key: keyof PublicFilters,
  value: string,
): number {
  const next = { ...filters, [key]: value };
  return entries.filter((entry) => matchesPublicFilters(entry, next)).length;
}

function optionCountLabel(count: number, label: string): string {
  return count > 0 ? `${label} (${count})` : label;
}

export function publicFilterOptions(
  entries: PortfolioGridEntry[],
  filters: PublicFilters,
  key: keyof PublicFilters,
  terms: TaxonomyTerm[],
  locale: Locale,
  phrases?: Record<string, string>,
): { value: string; label: string; disabled: boolean }[] {
  return flattenTaxonomyTree(terms).map(({ term, depth }) => {
    const slug = termSlug(term, locale);
    const count = countForPublicFilterValue(entries, filters, key, slug);
    return {
      value: slug,
      label:
        optionIndent(depth) +
        optionCountLabel(count, termLabel(term, locale, phrases)),
      disabled: count === 0 && filters[key] !== slug,
    };
  });
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

export function buildPublicQuery(filters: PublicFilters): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.format) query.format = filters.format;
  if (filters.industry) query.industry = filters.industry;
  if (filters.market) query.market = filters.market;
  return query;
}

export function publicFiltersMatchPresets(
  filters: PublicFilters,
  preset: PublicFilters,
): boolean {
  return (
    filters.format === preset.format &&
    filters.industry === preset.industry &&
    filters.market === preset.market
  );
}

/**
 * Mirror public filter state into the query string without App Router navigation.
 * When filters equal archive presets (or are empty on /work), write no query —
 * matching clearPublicFilters / initial archive URLs.
 */
export function replacePublicFiltersUrl(
  filters: PublicFilters,
  preset: PublicFilters,
): void {
  const query = publicFiltersMatchPresets(filters, preset)
    ? {}
    : buildPublicQuery(filters);
  const params = new URLSearchParams(query);
  const qs = params.toString();
  const next = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current) return;
  window.history.replaceState(window.history.state, '', next);
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
  phrases,
}: PortfolioGridProps) {
  const t = useTranslations('Filters');
  const router = useRouter();
  const pathname = usePathname();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const filterBarRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const presetFormat = presetFilters?.format ?? '';
  const presetIndustry = presetFilters?.industry ?? '';
  const presetMarket = presetFilters?.market ?? '';
  const publicPresets: PublicFilters = {
    format: presetFormat,
    industry: presetIndustry,
    market: presetMarket,
  };

  // Local state + history.replaceState (not router.replace) so filter changes
  // stay shareable without triggering an App Router RSC refetch.
  const [publicFilters, setPublicFilters] = useState(() =>
    readPublicFilters(searchParams, {
      format: presetFormat || undefined,
      industry: presetIndustry || undefined,
      market: presetMarket || undefined,
    }),
  );

  useEffect(() => {
    if (filterMode !== 'public') return;
    replacePublicFiltersUrl(publicFilters, publicPresets);
  }, [
    filterMode,
    publicFilters,
    presetFormat,
    presetIndustry,
    presetMarket,
  ]);

  useEffect(() => {
    if (filterMode !== 'public') return;
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      setPublicFilters(
        readPublicFilters(params, {
          format: presetFormat || undefined,
          industry: presetIndustry || undefined,
          market: presetMarket || undefined,
        }),
      );
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [filterMode, presetFormat, presetIndustry, presetMarket]);

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

  const formatOptions = useMemo(
    () =>
      filterMode === 'public'
        ? publicFilterOptions(
            entries as PortfolioGridEntry[],
            publicFilters,
            'format',
            videoFormats,
            locale,
            phrases,
          )
        : [],
    [filterMode, entries, publicFilters, videoFormats, locale, phrases],
  );
  const industryOptions = useMemo(
    () =>
      filterMode === 'public'
        ? publicFilterOptions(
            entries as PortfolioGridEntry[],
            publicFilters,
            'industry',
            industries,
            locale,
            phrases,
          )
        : [],
    [filterMode, entries, publicFilters, industries, locale, phrases],
  );
  const marketOptions = useMemo(
    () =>
      filterMode === 'public'
        ? publicFilterOptions(
            entries as PortfolioGridEntry[],
            publicFilters,
            'market',
            markets,
            locale,
            phrases,
          )
        : [],
    [filterMode, entries, publicFilters, markets, locale, phrases],
  );

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

  // Keep the filter bar visible after a filter change: only scroll when the
  // bar sits outside the comfortable viewport zone (fixed navbar covers the
  // top ~90px), and anchor to the bar itself instead of the grid.
  const keepFiltersInView = () => {
    const bar = filterBarRef.current;
    if (!bar) return;
    const headerOffset = 96;
    const rect = bar.getBoundingClientRect();
    if (rect.top >= headerOffset && rect.bottom <= window.innerHeight) return;
    window.scrollTo({
      top: window.scrollY + rect.top - headerOffset,
      behavior: 'smooth',
    });
  };

  const hasActivePublicFilters =
    publicFilters.format !== presetFormat ||
    publicFilters.industry !== presetIndustry ||
    publicFilters.market !== presetMarket;

  const updatePublicFilter = (key: keyof PublicFilters, value: string) => {
    setPublicFilters((prev) => ({ ...prev, [key]: value }));
    keepFiltersInView();
  };

  const clearPublicFilters = () => {
    setPublicFilters({
      format: presetFormat,
      industry: presetIndustry,
      market: presetMarket,
    });
    keepFiltersInView();
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
    keepFiltersInView();
  };

  const filterBar = filterMode === 'public' ? (
    <div
      ref={filterBarRef}
      className="vp-filterbar"
      aria-label={t('portfolioAria')}
    >
      <div className="vp-filterbar__inner">
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-format">
            {t('videoFormat')}
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-format"
              className="vp-filterbar__select"
              name="format"
              value={publicFilters.format}
              onChange={(e) => updatePublicFilter('format', e.target.value)}
            >
              <option value="">{t('all')}</option>
              {formatOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-industry">
            {t('industry')}
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-industry"
              className="vp-filterbar__select"
              name="industry"
              value={publicFilters.industry}
              onChange={(e) => updatePublicFilter('industry', e.target.value)}
            >
              <option value="">{t('all')}</option>
              {industryOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-market">
            {t('market')}
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-market"
              className="vp-filterbar__select"
              name="market"
              value={publicFilters.market}
              onChange={(e) => updatePublicFilter('market', e.target.value)}
            >
              <option value="">{t('all')}</option>
              {marketOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {hasActivePublicFilters ? (
          <button
            type="button"
            className="vp-filterbar__clear"
            onClick={clearPublicFilters}
          >
            {t('clear')}
          </button>
        ) : null}
      </div>
    </div>
  ) : (
    <div
      ref={filterBarRef}
      className="vp-filterbar"
      aria-label={t('crewAria')}
    >
      <div className="vp-filterbar__inner">
        <div className="vp-filterbar__group">
          <label className="vp-filterbar__label" htmlFor="vp-filter-client">
            {t('client')}
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-client"
              className="vp-filterbar__select"
              name="client"
              value={internalFilters.client}
              onChange={(e) => updateInternalFilter('client', e.target.value)}
            >
              <option value="">{t('all')}</option>
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
            {t('director')}
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-director"
              className="vp-filterbar__select"
              name="director"
              value={internalFilters.director}
              onChange={(e) => updateInternalFilter('director', e.target.value)}
            >
              <option value="">{t('all')}</option>
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
            {t('dop')}
          </label>
          <div className="vp-select-wrap">
            <select
              id="vp-filter-dop"
              className="vp-filterbar__select"
              name="dop"
              value={internalFilters.dop}
              onChange={(e) => updateInternalFilter('dop', e.target.value)}
            >
              <option value="">{t('all')}</option>
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
            {t('artDirector')}
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
              <option value="">{t('all')}</option>
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
        <div id="vp-portfolio-grid" className="vp-portfolio-gallery">
          {visibleEntries.map((entry, index) => (
            <PortfolioCard
              key={entry._id}
              entry={entry}
              locale={locale}
              revealIndex={index % PER_PAGE}
              phrases={phrases}
            />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-vp-text-soft">
          {t('empty')}
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
