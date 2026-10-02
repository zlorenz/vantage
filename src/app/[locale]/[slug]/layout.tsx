/**
 * Blog post layout.
 *
 * Stays mounted while the next post loads, so the scroll reset can run as
 * soon as the URL changes instead of waiting for the page body to finish.
 */

import {PortfolioCaseScrollReset} from '@/components/portfolio/PortfolioCaseScrollReset';

export default function BlogPostLayout({
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
