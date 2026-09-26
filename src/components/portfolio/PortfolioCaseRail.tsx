/**
 * PortfolioCaseRail — structural left column for the case-study shell.
 *
 * Desktop ≥992: in-flow rail with low-opacity VAP geometric mark + “all work”
 * back control (scrolls away with the header; not sticky/fixed).
 * ≤991: compact `.vp-case-mobile-back` above the header (phone chrome;
 * tablet/mid-width keeps the same control until the desktop rail appears).
 */

import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import './portfolio-case-rail.css';

function BackArrowIcon() {
  return (
    <svg
      className="vp-case-rail__back-icon"
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M8.6 1.4 3.5 6.5H14v1H3.5l5.1 5.1-.7.7L1.4 7l6.5-6.5.7.7Z"
      />
    </svg>
  );
}

export async function PortfolioCaseRail() {
  const t = await getTranslations('Navigation');
  const label = t('backToWork');

  return (
    <>
      <div className="vp-case-mobile-back">
        <Link href="/work" className="vp-case-mobile-back__link">
          <span className="vp-case-mobile-back__btn">
            <BackArrowIcon />
          </span>
          <span className="vp-case-mobile-back__label">{label}</span>
        </Link>
      </div>

      <aside className="vp-case-rail" aria-label={label}>
        <Link href="/work" className="vp-case-rail__back">
          <span className="vp-case-rail__back-btn">
            <BackArrowIcon />
          </span>
          <span className="vp-case-rail__back-label">{label}</span>
        </Link>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="vp-case-rail__mark"
          src="/brand/vap-pattern.svg"
          alt=""
          aria-hidden="true"
        />
      </aside>
    </>
  );
}
