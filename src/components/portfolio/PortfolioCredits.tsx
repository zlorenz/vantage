/**
 * PortfolioCredits — department grid with inline credit pairs from crewCredits.
 */

import { resolveCreditsForDisplay } from '@/lib/credits-config';
import { phraseRecordToMap, resolveLocalizedString } from '@phrase-book';
import type { Locale } from '@/i18n/routing';
import type { CrewCredit, CrewPerson } from '@/types/sanity';

interface PortfolioCreditsProps {
  crewCredits?: CrewCredit[];
  locale?: Locale;
  phrases?: Record<string, string>;
}

function creditDisplayName(
  person: CrewPerson,
  locale: Locale,
  phrases?: Record<string, string>,
): string {
  const map = phraseRecordToMap(phrases);
  if (locale === 'zh') {
    const identityZh = person.identityNameZh?.trim();
    if (identityZh) return identityZh;
    return resolveLocalizedString({
      locale: 'zh',
      en: person.identityName || person.name,
      phrases: map,
    });
  }
  return person.name;
}

function CreditNames({
  people,
  locale,
  phrases,
}: {
  people?: CrewPerson[];
  locale: Locale;
  phrases?: Record<string, string>;
}) {
  if (!people?.length) return null;

  return (
    <>
      {people.map((person, index) => {
        const displayName = creditDisplayName(person, locale, phrases);
        return (
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
                {displayName}
              </a>
            ) : (
              displayName
            )}
          </span>
        );
      })}
    </>
  );
}

export function PortfolioCredits({
  crewCredits,
  locale = 'en',
  phrases,
}: PortfolioCreditsProps) {
  const rows = resolveCreditsForDisplay({ crewCredits, locale, phrases });
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
                  <CreditNames
                    people={pair.people}
                    locale={locale}
                    phrases={phrases}
                  />
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
