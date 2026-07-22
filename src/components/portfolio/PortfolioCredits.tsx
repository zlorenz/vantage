/**
 * PortfolioCredits — department grid with inline credit pairs.
 *
 * Prefers structured crewCredits (safe React links). Falls back to legacy
 * department objects with sanitized HTML name strings.
 */

import { resolveCreditsForDisplay } from '@/lib/credits-config';
import { sanitizeCreditHtml } from '@/lib/sanitize-credit-html';
import type { Locale } from '@/i18n/routing';
import type {
  CrewCredit,
  CrewPerson,
  PortfolioCredits as PortfolioCreditsData,
} from '@/types/sanity';

interface PortfolioCreditsProps {
  crewCredits?: CrewCredit[];
  credits?: PortfolioCreditsData;
  locale?: Locale;
}

function CreditNames({ people, fallbackHtml }: { people?: CrewPerson[]; fallbackHtml: string }) {
  if (people?.length) {
    return (
      <>
        {people.map((person, index) => (
          <span key={`${person.name}-${index}`}>
            {index > 0 ? ', ' : null}
            {person.url ? (
              <a
                href={person.url}
                target="_blank"
                rel="noopener noreferrer"
                {...(person.linkTitle?.trim()
                  ? { title: person.linkTitle.trim() }
                  : {})}
              >
                {person.name}
              </a>
            ) : (
              person.name
            )}
          </span>
        ))}
      </>
    );
  }

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: sanitizeCreditHtml(fallbackHtml),
      }}
    />
  );
}

export function PortfolioCredits({
  crewCredits,
  credits,
  locale = 'en',
}: PortfolioCreditsProps) {
  const rows = resolveCreditsForDisplay({ crewCredits, credits, locale });
  if (!rows.length) return null;

  return (
    <div className="vp-credits">
      {rows.map((row) => (
        <div key={row.key} className="vp-credits__row">
          <div className="vp-credits__dept">{row.label}</div>
          <div className="vp-credits__content">
            {row.pairs.map((pair, index) => (
              <span key={`${pair.role}-${index}`} className="vp-credit-pair">
                <span className="vp-credit-role">{pair.role} </span>
                <span className="vp-credit-names">
                  <CreditNames people={pair.people} fallbackHtml={pair.names} />
                </span>
                {index < row.pairs.length - 1 ? ' ' : null}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
