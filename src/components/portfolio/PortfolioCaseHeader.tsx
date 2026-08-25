/**
 * PortfolioCaseHeader — minimal case-study title, taxonomy pills, and key credits.
 *
 * Visual treatment parallels the homepage carousel overlay (brand / campaign /
 * label-above-value credits) via dedicated `.vp-case-header__*` classes so
 * carousel and case-study styles can diverge independently.
 */

import {composeOverlayCopy, joinOverlayList} from '@/components/prototype/carousel/overlay';
import type {Locale} from '@/i18n/routing';
import {getStructuredRoleNames} from '@/lib/credits-config';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import type {CrewCredit, DisplayTitlePartsValue, TaxonomyTerm} from '@/types/sanity';
import type {PhraseLookup} from '@display-titles';
import './portfolio-case-header.css';

type TaxonomyRef = Pick<TaxonomyTerm, 'title' | 'titleZh' | 'slug' | 'slugZh'>;

type PortfolioCaseHeaderProps = {
  locale: Locale;
  phrases?: PhraseLookup | null;
  displayTitleParts?: DisplayTitlePartsValue | null;
  publishedAt?: string | null;
  videoFormats?: TaxonomyRef[] | null;
  industries?: TaxonomyRef[] | null;
  markets?: TaxonomyRef[] | null;
  crewCredits?: CrewCredit[] | null;
};

const CREDIT_ROLES = [
  {roleKey: 'agency', label: 'Agency'},
  {roleKey: 'director', label: 'Director'},
  {roleKey: 'dop', label: 'DOP'},
  {roleKey: 'art_director', label: 'Art Director'},
] as const;

function publishedYear(publishedAt?: string | null): string | null {
  const raw = publishedAt?.trim();
  if (!raw) return null;
  const year = Number.parseInt(raw.slice(0, 4), 10);
  if (!Number.isFinite(year) || year < 1000) return null;
  return String(year);
}

function taxonomyPillLabels(
  terms: TaxonomyRef[] | null | undefined,
  locale: Locale,
  phrases?: PhraseLookup | null,
): string[] {
  const labels: string[] = [];
  for (const term of terms ?? []) {
    const label = pickLocaleFieldWithPhrases(
      locale,
      term.title,
      term.titleZh,
      phrases,
    ).trim();
    if (label) labels.push(label);
  }
  return labels;
}

export function PortfolioCaseHeader({
  locale,
  phrases,
  displayTitleParts,
  publishedAt,
  videoFormats,
  industries,
  markets,
  crewCredits,
}: PortfolioCaseHeaderProps) {
  const parts = resolveEntryDisplayTitleParts(
    {displayTitleParts},
    locale,
    phrases,
  );
  const {brandLine, campaignLine} = composeOverlayCopy(parts);

  const pills = [
    ...taxonomyPillLabels(videoFormats, locale, phrases),
    ...taxonomyPillLabels(industries, locale, phrases),
    ...taxonomyPillLabels(markets, locale, phrases),
  ];

  const year = publishedYear(publishedAt);
  const credits = CREDIT_ROLES.flatMap(({roleKey, label}) => {
    const names = joinOverlayList(
      getStructuredRoleNames(crewCredits ?? [], roleKey),
    );
    return names ? [{roleKey, label, names}] : [];
  });

  if (!brandLine && !campaignLine && pills.length === 0 && !year && credits.length === 0) {
    return null;
  }

  return (
    <header className="vp-case-header">
      <div className="vp-case-header__top">
        <div className="vp-case-header__title-block">
          {brandLine ? (
            <p className="vp-case-header__brand">{brandLine}</p>
          ) : null}
          {campaignLine ? (
            <h1 className="vp-case-header__campaign">{campaignLine}</h1>
          ) : null}
        </div>
        {pills.length > 0 ? (
          <ul className="vp-case-header__pills">
            {pills.map((label, index) => (
              <li key={`${index}-${label}`} className="vp-case-header__pill">
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {year || credits.length > 0 ? (
        <div className="vp-case-header__meta">
          {year ? <p className="vp-case-header__year">{year}</p> : null}
          {credits.length > 0 ? (
            <dl className="vp-case-header__credits">
              {credits.map((credit) => (
                <div key={credit.roleKey} className="vp-case-header__credit">
                  <dt>{credit.label}</dt>
                  <dd>{credit.names}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
