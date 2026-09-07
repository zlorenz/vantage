/**
 * PortfolioCredits — two equal columns of department blocks with a
 * vertical hairline between them (Figma 84:37512).
 *
 * Column assignment follows catalog order: departments before `art`
 * (Production / Camera / G&E) on the left; Art and later on the right —
 * matching Figma’s grouped-by-column layout rather than CSS-columns masonry.
 */

import {CREW_DEPARTMENTS} from '@crew-credits';
import { resolveCreditsForDisplay } from '@/lib/credits-config';
import { phraseRecordToMap, resolveLocalizedString } from '@phrase-book';
import type { Locale } from '@/i18n/routing';
import type { CrewCredit, CrewPerson } from '@/types/sanity';

interface PortfolioCreditsProps {
  crewCredits?: CrewCredit[];
  locale?: Locale;
  phrases?: Record<string, string>;
}

/** Catalog keys that sit in the left column (Figma: Production → G&E). */
const ART_INDEX = CREW_DEPARTMENTS.findIndex((dept) => dept.key === 'art');
const LEFT_COLUMN_KEYS = new Set(
  CREW_DEPARTMENTS.slice(0, ART_INDEX === -1 ? CREW_DEPARTMENTS.length : ART_INDEX).map(
    (dept) => dept.key,
  ),
);

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
  // Known NFC gap (future pass): EN credit person names bypass resolvers.
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
          <span key={person._key ?? `person-${index}`}>
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

function DepartmentBlock({
  row,
  locale,
  phrases,
}: {
  row: ReturnType<typeof resolveCreditsForDisplay>[number];
  locale: Locale;
  phrases?: Record<string, string>;
}) {
  return (
    <div className="vp-credits__dept">
      <div className="vp-credits__dept-head">
        <div className="vp-credits__rule" aria-hidden="true" />
        <div className="vp-credits__dept-name">{`●  ${row.label}`}</div>
        <div className="vp-credits__rule" aria-hidden="true" />
      </div>
      <div className="vp-credits__rows">
        {row.pairs.map((pair, index) => (
          <div key={index} className="vp-credit-pair">
            <span className="vp-credit-role">{pair.role}</span>
            <span className="vp-credit-names">
              <CreditNames
                people={pair.people}
                locale={locale}
                phrases={phrases}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PortfolioCredits({
  crewCredits,
  locale = 'en',
  phrases,
}: PortfolioCreditsProps) {
  const rows = resolveCreditsForDisplay({ crewCredits, locale, phrases });
  if (!rows.length) return null;

  const left = rows.filter((row) => LEFT_COLUMN_KEYS.has(row.key));
  const right = rows.filter((row) => !LEFT_COLUMN_KEYS.has(row.key));
  const showDivider = left.length > 0 && right.length > 0;

  return (
    <div
      className={
        showDivider ? 'vp-credits vp-credits--split' : 'vp-credits'
      }
    >
      {left.length > 0 ? (
        <div className="vp-credits__col">
          {left.map((row) => (
            <DepartmentBlock
              key={row.key}
              row={row}
              locale={locale}
              phrases={phrases}
            />
          ))}
        </div>
      ) : null}
      {showDivider ? (
        <div className="vp-credits__divider" aria-hidden="true" />
      ) : null}
      {right.length > 0 ? (
        <div className="vp-credits__col">
          {right.map((row) => (
            <DepartmentBlock
              key={row.key}
              row={row}
              locale={locale}
              phrases={phrases}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
