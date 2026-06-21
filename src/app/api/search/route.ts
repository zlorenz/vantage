/**
 * Search API route — server-side Sanity query for portfolio and blog matches.
 */

import { NextResponse } from 'next/server';
import { urlForImage } from '@/lib/sanity';
import { sanityClient } from '@/lib/sanity';
import { SEARCH_QUERY } from '@/sanity/queries/search';
import type { SearchResultItem } from '@/types/sanity';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const results = await sanityClient.fetch<SearchResultItem[]>(SEARCH_QUERY, {
    searchTerm: q,
  });

  const enriched = results.map((item) => ({
    ...item,
    imageUrl: item.featuredImage
      ? urlForImage(item.featuredImage).width(960).height(540).fit('crop').url()
      : null,
  }));

  return NextResponse.json({ results: enriched });
}
