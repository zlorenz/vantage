/**
 * PortfolioCredits — department grid with inline credit pairs.
 */

import {
  CREDITS_CONFIG,
  getDepartmentCreditPairs,
  localizeCreditLabel,
} from '@/lib/credits-config';
import { sanitizeCreditHtml } from '@/lib/sanitize-credit-html';
import type { Locale } from '@/i18n/routing';
import type { PortfolioCredits as PortfolioCreditsData } from '@/types/sanity';

interface PortfolioCreditsProps {
  credits?: PortfolioCreditsData;
  locale?: Locale;
}

export function PortfolioCredits({
  credits,
  locale = 'en',
}: PortfolioCreditsProps) {
  if (!credits) return null;

  const rows = CREDITS_CONFIG.map((config) => {
    const department = credits[config.key];
    const pairs = getDepartmentCreditPairs(department, config, locale);
    if (!pairs.length) return null;

    return (
      <div key={config.key} className="vp-credits__row">
        <div className="vp-credits__dept">
          {localizeCreditLabel(config.label, locale)}
        </div>
        <div className="vp-credits__content">
          {pairs.map((pair, index) => (
            <span key={`${pair.role}-${index}`} className="vp-credit-pair">
              <span className="vp-credit-role">{pair.role} </span>
              <span
                className="vp-credit-names"
                dangerouslySetInnerHTML={{
                  __html: sanitizeCreditHtml(pair.names),
                }}
              />
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
