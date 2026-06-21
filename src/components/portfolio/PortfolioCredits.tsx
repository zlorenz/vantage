/**
 * PortfolioCredits — department grid with inline credit pairs.
 */

import {
  CREDITS_CONFIG,
  getDepartmentCreditPairs,
} from '@/lib/credits-config';
import type { PortfolioCredits as PortfolioCreditsData } from '@/types/sanity';

interface PortfolioCreditsProps {
  credits?: PortfolioCreditsData;
}

export function PortfolioCredits({ credits }: PortfolioCreditsProps) {
  if (!credits) return null;

  const rows = CREDITS_CONFIG.map((config) => {
    const department = credits[config.key];
    const pairs = getDepartmentCreditPairs(department, config);
    if (!pairs.length) return null;

    return (
      <div key={config.key} className="vp-credits__row">
        <div className="vp-credits__dept">{config.label}</div>
        <div className="vp-credits__content">
          {pairs.map((pair, index) => (
            <span key={`${pair.role}-${index}`} className="vp-credit-pair">
              <span className="vp-credit-role">{pair.role}: </span>
              <span className="vp-credit-names">{pair.names}</span>
              {index < pairs.length - 1 ? ' ' : null}
            </span>
          ))}
        </div>
      </div>
    );
  }).filter(Boolean);

  if (!rows.length) return null;

  return <div className="vp-credits">{rows}</div>;
}
