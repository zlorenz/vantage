'use client';

import {useLinkStatus} from 'next/link';

/** Inline pending hint for next-intl / next Link descendants. */
export function LinkPendingHint({className}: {className?: string}) {
  const {pending} = useLinkStatus();

  return (
    <span
      aria-hidden
      className={`vp-link-pending-hint${pending ? ' is-pending' : ''}${className ? ` ${className}` : ''}`}
    />
  );
}
