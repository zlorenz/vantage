'use client';

/**
 * PortfolioGrid — filter bar, client-side filtering, and infinite scroll.
 *
 * Receives all entries as props from SSG parent pages. Filtering and
 * pagination happen in memory — no API calls.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { trackInteractionEvent } from '@/lib/interaction-events';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { flattenTaxonomyTree, optionIndent } from '@/lib/taxonomy-tree';
import { PortfolioCard } from './PortfolioCard';
import type { Locale } from '@/i18n/routing';
import type { PortfolioGridEntry, TaxonomyTerm } from '@/types/sanity';

const PER_PAGE = 12;

export interface PublicPresetFilters {
  format?: string;
  industry?: string;
  market?: string;
}

interface PortfolioGridProps {
  locale: Locale;
  entries: PortfolioGridEntry[];
  videoFormats?: TaxonomyTerm[];
  industries?: TaxonomyTerm[];
  markets?: TaxonomyTerm[];
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

/** Baseline for global counts: page presets only, no stacked user selections. */
function baselinePublicFiltersForFacet(
  key: keyof PublicFilters,
  preset?: PublicPresetFilters,
): PublicFilters {
  return {
    format: key === 'format' ? '' : preset?.format || '',
    industry: key === 'industry' ? '' : preset?.industry || '',
    market: key === 'market' ? '' : preset?.market || '',
  };
}

export function publicFilterOptions(
  entries: PortfolioGridEntry[],
  filters: PublicFilters,
  key: keyof PublicFilters,
  terms: TaxonomyTerm[],
  locale: Locale,
  phrases?: Record<string, string>,
  preset?: PublicPresetFilters,
): { value: string; label: string; disabled: boolean }[] {
  const baseline = baselinePublicFiltersForFacet(key, preset);

  return flattenTaxonomyTree(terms)
    .map(({ term, depth }) => {
      const slug = termSlug(term, locale);
      const globalCount = countForPublicFilterValue(
        entries,
        baseline,
        key,
        slug,
      );
      const facetCount = countForPublicFilterValue(entries, filters, key, slug);
      const selected = filters[key] === slug;

      // Hide terms with no public items in this gallery scope (keep stale selection).
      if (globalCount === 0 && !selected) {
        return null;
      }

      return {
        value: slug,
        label:
          optionIndent(depth) +
          optionCountLabel(facetCount, termLabel(term, locale, phrases)),
        disabled: globalCount > 0 && facetCount === 0 && !selected,
      };
    })
    .filter((opt): opt is { value: string; label: string; disabled: boolean } =>
      opt !== null,
    );
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
 * When filters equal archive presets (or are empty on /work), write no filter
 * query — matching clearPublicFilters / initial archive URLs.
 * `extraQuery` is for route-specific params (e.g. /work `item=`); empty values
 * are omitted so callers can drop a key by passing `{}`.
 */
export function replacePublicFiltersUrl(
  filters: PublicFilters,
  preset: PublicFilters,
  extraQuery?: Record<string, string>,
): void {
  const query: Record<string, string> = publicFiltersMatchPresets(filters, preset)
    ? {}
    : buildPublicQuery(filters);
  if (extraQuery) {
    for (const [key, value] of Object.entries(extraQuery)) {
      if (value) query[key] = value;
    }
  }
  const params = new URLSearchParams(query);
  const qs = params.toString();
  const next = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current) return;
  window.history.replaceState(window.history.state, '', next);
}

export function PortfolioGrid({
  locale,
  entries,
  videoFormats = [],
  industries = [],
  markets = [],
  presetFilters,
  phrases,
}: PortfolioGridProps) {
  const t = useTranslations('Filters');
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
    replacePublicFiltersUrl(publicFilters, publicPresets);
  }, [
    publicFilters,
    presetFormat,
    presetIndustry,
    presetMarket,
  ]);

  useEffect(() => {
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
  }, [presetFormat, presetIndustry, presetMarket]);

  const filterSignature = [
    publicFilters.format,
    publicFilters.industry,
    publicFilters.market,
  ].join('|');

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => matchesPublicFilters(entry, publicFilters)),
    [entries, publicFilters],
  );

  const formatOptions = useMemo(
    () =>
      publicFilterOptions(
        entries,
        publicFilters,
        'format',
        videoFormats,
        locale,
        phrases,
        publicPresets,
      ),
    [entries, publicFilters, videoFormats, locale, phrases, publicPresets],
  );
  const industryOptions = useMemo(
    () =>
      publicFilterOptions(
        entries,
        publicFilters,
        'industry',
        industries,
        locale,
        phrases,
        publicPresets,
      ),
    [entries, publicFilters, industries, locale, phrases, publicPresets],
  );
  const marketOptions = useMemo(
    () =>
      publicFilterOptions(
        entries,
        publicFilters,
        'market',
        markets,
        locale,
        phrases,
        publicPresets,
      ),
    [entries, publicFilters, markets, locale, phrases, publicPresets],
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
    const next = { ...publicFilters, [key]: value };
    setPublicFilters(next);
    trackInteractionEvent({
      eventType: 'filter_change',
      sourceSurface: 'taxonomy_archive',
      filters: next,
    });
    keepFiltersInView();
  };

  const clearPublicFilters = () => {
    const next = {
      format: presetFormat,
      industry: presetIndustry,
      market: presetMarket,
    };
    setPublicFilters(next);
    trackInteractionEvent({
      eventType: 'filter_change',
      sourceSurface: 'taxonomy_archive',
      filters: next,
    });
    keepFiltersInView();
  };

  return (
    <>
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
