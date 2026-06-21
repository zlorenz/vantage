'use client';

/**
 * ContactPageClient — opens ContactModal and returns user to home.
 */

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useContactModal } from '@/components/layout/ContactModalContext';

export function ContactPageClient() {
  const { openContact } = useContactModal();
  const router = useRouter();

  useEffect(() => {
    openContact();
    router.replace('/');
  }, [openContact, router]);

  return (
    <>
      <noscript>
        <meta httpEquiv="refresh" content="0;url=/" />
      </noscript>
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-vp-text-muted">Opening contact…</p>
      </div>
    </>
  );
}
