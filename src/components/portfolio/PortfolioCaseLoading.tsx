/**
 * Skeleton for portfolio case study routes — used by loading.tsx and Suspense fallbacks.
 */

import {SectionWrapper} from '@/components/ui/SectionWrapper';

export function PortfolioCaseLoading() {
  return (
    <SectionWrapper
      fullBleed={true}
      className="!pt-[var(--vp-section-y-header-condensed)]"
    >
      <div
        className="vp-portfolio-case-loading mx-auto w-full max-w-[1680px] px-4 md:px-6 xl:px-8"
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading project"
      >
        <div className="vp-portfolio-case-loading__header">
          <div className="vp-portfolio-case-loading__line vp-portfolio-case-loading__line--brand" />
          <div className="vp-portfolio-case-loading__line vp-portfolio-case-loading__line--title" />
          <div className="vp-portfolio-case-loading__meta">
            <div className="vp-portfolio-case-loading__pill" />
            <div className="vp-portfolio-case-loading__pill" />
            <div className="vp-portfolio-case-loading__pill" />
          </div>
        </div>
        <div className="vp-portfolio-case-loading__video" />
        <div className="vp-portfolio-case-loading__credits">
          <div className="vp-portfolio-case-loading__credit" />
          <div className="vp-portfolio-case-loading__credit" />
          <div className="vp-portfolio-case-loading__credit" />
        </div>
      </div>
    </SectionWrapper>
  );
}
