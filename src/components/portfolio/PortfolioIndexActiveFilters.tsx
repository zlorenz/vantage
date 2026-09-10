'use client';

/**
 * Main-stage active filter/search chrome for /work PortfolioIndexCarousel.
 * Clear-all + removable labeled pills — outside filter dropdowns / sheet.
 */

import {useMemo} from 'react';
import {useTranslations} from 'next-intl';
import {decodeHtmlEntities} from '@/lib/decode-html-entities';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import {flattenTaxonomyTree} from '@/lib/taxonomy-tree';
import type {Locale} from '@/i18n/routing';
import type {TaxonomyTerm} from '@/types/sanity';
import type {PublicFilters} from './PortfolioGrid';
import './portfolio-index-active-filters.css';

type TaxonomyKey = keyof PublicFilters;

interface PortfolioIndexActiveFiltersProps {
  locale: Locale;
  phrases?: Record<string, string>;
  filters: PublicFilters;
  searchValue: string;
  onClearFilter: (key: TaxonomyKey) => void;
  onClearSearch: () => void;
  onClearAll: () => void;
  videoFormats: TaxonomyTerm[];
  industries: TaxonomyTerm[];
  markets: TaxonomyTerm[];
}

const TAXONOMY_ORDER: TaxonomyKey[] = ['format', 'industry', 'market'];

const TAXONOMY_LABEL_KEY: Record<
  TaxonomyKey,
  'videoFormat' | 'industry' | 'market'
> = {
  format: 'videoFormat',
  industry: 'industry',
  market: 'market',
};

function termSlug(term: TaxonomyTerm, locale: Locale): string {
  return locale === 'zh' ? term.slugZh || term.slug : term.slug;
}

function termTitle(
  term: TaxonomyTerm,
  locale: Locale,
  phrases?: Record<string, string>,
): string {
  return decodeHtmlEntities(
    pickLocaleFieldWithPhrases(locale, term.title, term.titleZh, phrases),
  );
}

function findTermLabel(
  terms: TaxonomyTerm[],
  slug: string,
  locale: Locale,
  phrases?: Record<string, string>,
): string {
  for (const {term} of flattenTaxonomyTree(terms)) {
    if (termSlug(term, locale) === slug) {
      return termTitle(term, locale, phrases);
    }
  }
  return slug;
}

function PillRemoveIcon() {
  return (
    <svg
      className="vp-portfolio-index__active-filters-pill-remove-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M6.22 6.22a.75.75 0 0 1 1.06 0L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 12 6.22 7.28a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

export function PortfolioIndexActiveFilters({
  locale,
  phrases,
  filters,
  searchValue,
  onClearFilter,
  onClearSearch,
  onClearAll,
  videoFormats,
  industries,
  markets,
}: PortfolioIndexActiveFiltersProps) {
  const t = useTranslations('Filters');
  const tSearch = useTranslations('Search');
  const committedSearch = searchValue.trim();

  const termsByKey: Record<TaxonomyKey, TaxonomyTerm[]> = useMemo(
    () => ({
      format: videoFormats,
      industry: industries,
      market: markets,
    }),
    [videoFormats, industries, markets],
  );

  const pills = useMemo(() => {
    const next: {
      key: string;
      prefix: string;
      value: string;
      removeAria: string;
      onRemove: () => void;
    }[] = [];

    for (const key of TAXONOMY_ORDER) {
      const slug = filters[key];
      if (!slug) continue;
      const prefix = t(TAXONOMY_LABEL_KEY[key]);
      const value = findTermLabel(termsByKey[key], slug, locale, phrases);
      const label = `${prefix}: ${value}`;
      next.push({
        key,
        prefix,
        value,
        removeAria: t('removeFilterAria', {label}),
        onRemove: () => onClearFilter(key),
      });
    }

    if (committedSearch) {
      const prefix = tSearch('title');
      const label = `${prefix}: ${committedSearch}`;
      next.push({
        key: 'search',
        prefix,
        value: committedSearch,
        removeAria: t('clearSearchPillAria', {query: committedSearch}),
        onRemove: onClearSearch,
      });
    }

    return next;
  }, [
    filters.format,
    filters.industry,
    filters.market,
    committedSearch,
    termsByKey,
    locale,
    phrases,
    onClearFilter,
    onClearSearch,
    t,
    tSearch,
  ]);

  if (pills.length === 0) return null;

  return (
    <div
      className="vp-portfolio-index__active-filters"
      aria-label={t('activeFiltersAria')}
    >
      <button
        type="button"
        className="vp-portfolio-index__active-filters-clear"
        onClick={onClearAll}
      >
        {t('clearAll')}
      </button>
      <ul className="vp-portfolio-index__active-filters-pills">
        {pills.map((pill) => (
          <li key={pill.key} className="vp-portfolio-index__active-filters-pill">
            <button
              type="button"
              className="vp-portfolio-index__active-filters-pill-remove"
              aria-label={pill.removeAria}
              onClick={pill.onRemove}
            >
              <PillRemoveIcon />
            </button>
            <span className="vp-portfolio-index__active-filters-pill-label">
              <span className="vp-portfolio-index__active-filters-pill-prefix">
                {pill.prefix}:
              </span>{' '}
              <span className="vp-portfolio-index__active-filters-pill-value">
                {pill.value}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
