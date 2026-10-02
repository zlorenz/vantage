/**
 * Portfolio case layout.
 *
 * Stays mounted while the next case loads, so the scroll reset can run as
 * soon as the URL changes instead of waiting for the page body to finish.
 */

import {PortfolioCaseScrollReset} from '@/components/portfolio/PortfolioCaseScrollReset';

export default function PortfolioCaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PortfolioCaseScrollReset />
      {children}
    </>
  );
}
