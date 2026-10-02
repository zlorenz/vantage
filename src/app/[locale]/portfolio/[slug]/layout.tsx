/**
 * Portfolio case layout.
 *
 * Stays mounted while the next case loads, so the scroll reset can run as
 * soon as the URL changes instead of waiting for the page body to finish.
 */

import {notFound} from 'next/navigation';
import {PortfolioCaseScrollReset} from '@/components/portfolio/PortfolioCaseScrollReset';
import {loadPortfolioEntry} from '@/lib/portfolio-entry';

export default async function PortfolioCaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{slug: string}>;
}) {
  const {slug} = await params;
  // Above loading.tsx, so a missing case is a real 404 rather than a
  // prerendered 200 that only looks like the 404 page.
  const entry = await loadPortfolioEntry(slug);
  if (!entry.data) notFound();

  return (
    <>
      <PortfolioCaseScrollReset />
      {children}
    </>
  );
}
