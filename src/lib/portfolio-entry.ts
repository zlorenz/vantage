/**
 * Shared portfolio case fetch.
 *
 * The case layout and the page both need the entry. React cache() collapses
 * those two calls into one Sanity request per render.
 *
 * The layout calls notFound() when the entry is missing. That check has to
 * live in the layout: portfolio/[slug]/loading.tsx wraps the page in Suspense,
 * and a notFound() inside that boundary is prerendered as HTTP 200.
 */

import { cache } from 'react';
import { decodePathSlug } from '@/lib/path-slug';
import { sanityFetch } from '@/sanity/lib/live';
import { PORTFOLIO_ENTRY_QUERY } from '@/sanity/queries/portfolio';

export const loadPortfolioEntry = cache((rawSlug: string) => {
  const slug = decodePathSlug(rawSlug);
  return sanityFetch({ query: PORTFOLIO_ENTRY_QUERY, params: { slug } });
});
