'use client';

/**
 * Portfolio case-study route error boundary — surfaces failed RSC navigations
 * (e.g. upstream 503/timeouts) instead of leaving the previous page frozen.
 */

import {useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {SectionWrapper} from '@/components/ui/SectionWrapper';

type PortfolioEntryErrorProps = {
  error: Error & {digest?: string};
  reset: () => void;
};

export default function PortfolioEntryError({
  error,
  reset,
}: PortfolioEntryErrorProps) {
  const t = useTranslations('Navigation');

  useEffect(() => {
    console.error('[portfolio route]', error);
  }, [error]);

  return (
    <SectionWrapper
      fullBleed={true}
      className="!pt-[var(--vp-section-y-header-condensed)]"
    >
      <div className="mx-auto w-full max-w-[1680px] px-4 md:px-6 xl:px-8">
        <div
          className="vp-route-error rounded-2xl border border-white/10 bg-white/5 px-6 py-10 md:px-10"
          role="alert"
        >
          <h1 className="font-vp-heading text-2xl uppercase tracking-vp-heading text-white md:text-3xl">
            {t('portfolioLoadErrorTitle')}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/75">
            {t('portfolioLoadErrorBody')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-vp-nav-pill bg-vp-orange px-5 py-2.5 text-sm font-medium uppercase tracking-vp-navbar text-black transition-opacity hover:opacity-90"
            >
              {t('tryAgain')}
            </button>
            <Link
              href="/work"
              className="rounded-vp-nav-pill border border-white/20 px-5 py-2.5 text-sm font-medium uppercase tracking-vp-navbar text-white transition-colors hover:border-white/40"
            >
              {t('backToWork')}
            </Link>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
