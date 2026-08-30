'use client';

/**
 * Portfolio case-study link — prefetch disabled to avoid duplicate in-flight RSC
 * requests (prefetch + click) that were surfacing as 503 on Vercel.
 */

import type {ComponentProps, ReactNode} from 'react';
import {Link} from '@/i18n/navigation';
import {LinkPendingHint} from '@/components/navigation/LinkPendingHint';

type PortfolioEntryLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  slug: string;
  children: ReactNode;
  showPendingHint?: boolean;
};

export function PortfolioEntryLink({
  slug,
  children,
  showPendingHint = false,
  ...rest
}: PortfolioEntryLinkProps) {
  return (
    <Link
      {...rest}
      prefetch={false}
      href={{
        pathname: '/portfolio/[slug]',
        params: {slug},
      }}
    >
      {children}
      {showPendingHint ? <LinkPendingHint /> : null}
    </Link>
  );
}
