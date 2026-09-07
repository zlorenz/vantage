/**
 * PortfolioCaseRail — structural left column for the case-study shell.
 *
 * Desktop: in-flow rail with low-opacity VAP geometric mark + “all work”
 * back control (scrolls away with the header; not sticky/fixed). Mobile
 * collapse is handled by portfolio-case-rail.css (reuses the redesign’s
 * 992px Figma-desktop split).
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

  return (
    <aside className="vp-case-rail" aria-label={t('backToWork')}>
      <Link href="/work" className="vp-case-rail__back">
        <span className="vp-case-rail__back-btn">
          <BackArrowIcon />
        </span>
        <span className="vp-case-rail__back-label">{t('backToWork')}</span>
      </Link>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="vp-case-rail__mark"
        src="/brand/vap-pattern.svg"
        alt=""
        aria-hidden="true"
      />
    </aside>
  );
}
