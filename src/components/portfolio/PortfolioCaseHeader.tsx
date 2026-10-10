/**
 * PortfolioCaseHeader — case-study title + taxonomy pills.
 *
 * Visual treatment parallels the homepage carousel overlay (brand / campaign)
 * via dedicated `.vp-case-header__*` classes so carousel and case-study styles
 * can diverge independently. Key crew lives in PortfolioCredits below the fold.
 */

import {composeOverlayCopy} from '@/lib/overlay-copy';
import type {Locale} from '@/i18n/routing';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import type {DisplayTitlePartsValue, TaxonomyTerm} from '@/types/sanity';
import type {PhraseLookup} from '@display-titles';
import '@/components/blog/blog-post-page.css';
import './portfolio-case-header.css';

type TaxonomyRef = Pick<TaxonomyTerm, 'title' | 'titleZh' | 'slug' | 'slugZh'>;

/** Industry refs for pill collapse — parent fields from PORTFOLIO_ENTRY_QUERY. */
type IndustryPillTerm = TaxonomyRef & {
  _id?: string;
  parentId?: string | null;
  parent?: Pick<TaxonomyTerm, 'title' | 'titleZh'> | null;
};

type PortfolioCaseHeaderProps = {
  locale: Locale;
  phrases?: PhraseLookup | null;
  displayTitleParts?: DisplayTitlePartsValue | null;
  videoFormats?: TaxonomyRef[] | null;
  industries?: IndustryPillTerm[] | null;
  markets?: TaxonomyRef[] | null;
};

function termLabel(
  term: Pick<TaxonomyTerm, 'title' | 'titleZh'> | null | undefined,
  locale: Locale,
  phrases?: PhraseLookup | null,
): string {
  if (!term) return '';
  return pickLocaleFieldWithPhrases(
    locale,
    term.title,
    term.titleZh,
    phrases,
  ).trim();
}

/** Flat pills — used for videoFormats / markets (no hierarchy in this pass). */
function taxonomyPillLabels(
  terms: TaxonomyRef[] | null | undefined,
  locale: Locale,
  phrases?: PhraseLookup | null,
): string[] {
  const labels: string[] = [];
  for (const term of terms ?? []) {
    const label = termLabel(term, locale, phrases);
    if (label) labels.push(label);
  }
  return labels;
}

/**
 * Industry pills with parent+child collapse.
 * When BOTH a parent and its child are tagged on the entry → one pill
 * "Parent: Child". Parent-only / child-only (parent not tagged) stay flat.
 * Parent + N children → N pills ("Parent: Child1", "Parent: Child2").
 *
 * Markets / videoFormats stay on taxonomyPillLabels; extend this helper
 * later if those taxonomies gain a real parent/child hierarchy in Studio.
 */
function industryPillLabels(
  terms: IndustryPillTerm[] | null | undefined,
  locale: Locale,
  phrases?: PhraseLookup | null,
): string[] {
  const list = terms ?? [];
  const taggedIds = new Set(
    list.map((term) => term._id).filter((id): id is string => Boolean(id)),
  );

  // Parents that have ≥1 tagged child — omit as standalone pills.
  const parentsWithTaggedChildren = new Set<string>();
  for (const term of list) {
    if (term.parentId && taggedIds.has(term.parentId)) {
      parentsWithTaggedChildren.add(term.parentId);
    }
  }

  // Resolve parent titles from the tagged list when parent->{…} is thin.
  const termById = new Map(
    list.filter((term) => term._id).map((term) => [term._id as string, term]),
  );

  const labels: string[] = [];
  for (const term of list) {
    if (term._id && parentsWithTaggedChildren.has(term._id)) {
      continue;
    }

    const ownLabel = termLabel(term, locale, phrases);
    if (!ownLabel) continue;

    if (term.parentId && taggedIds.has(term.parentId)) {
      const parentTerm = term.parent ?? termById.get(term.parentId);
      const parentLabel = termLabel(parentTerm, locale, phrases);
      if (parentLabel) {
        labels.push(`${parentLabel}: ${ownLabel}`);
        continue;
      }
    }

    labels.push(ownLabel);
  }

  return labels;
}

export function PortfolioCaseHeader({
  locale,
  phrases,
  displayTitleParts,
  videoFormats,
  industries,
  markets,
}: PortfolioCaseHeaderProps) {
  const parts = resolveEntryDisplayTitleParts(
    {displayTitleParts},
    locale,
    phrases,
  );
  const {brandLine, campaignLine} = composeOverlayCopy(parts);

  const pills = [
    ...taxonomyPillLabels(videoFormats, locale, phrases),
    ...industryPillLabels(industries, locale, phrases),
    ...taxonomyPillLabels(markets, locale, phrases),
  ];

  if (!brandLine && !campaignLine && pills.length === 0) {
    return null;
  }

  const pillsList =
    pills.length > 0 ? (
      <ul className="vp-case-header__pills">
        {pills.map((label, index) => (
          <li key={`${index}-${label}`} className="vp-blog-hero__pill">
            {label}
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <header className="vp-case-header">
      <div className="vp-case-header__title-block">
        {brandLine ? (
          <p className="vp-case-header__brand">{`●  ${brandLine}`}</p>
        ) : null}
        {campaignLine ? (
          <h1 className="vp-case-header__campaign">{campaignLine}</h1>
        ) : null}
      </div>

      {pillsList ? (
        <div className="vp-case-header__meta">{pillsList}</div>
      ) : null}
    </header>
  );
}
