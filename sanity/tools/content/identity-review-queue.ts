/**
 * Live pending identity-link review count for the Crew Members dashboard.
 *
 * Mirrors scripts/migration/audit/link-casting-stills-identities-dry-run.ts:
 * for each department in FULL_IDENTITY_LINK_DEPARTMENTS, run
 * resolveIdentityLinksOnCredits with identityLinkPolicyForDepartments([dept])
 * and count reviewLinks whose department matches. Same policy + resolver as
 * migration dry-runs — do not invent a parallel heuristic.
 */

import {
  buildIdentityDepartmentUsageFromCredits,
  type CrewCreditValue,
  type CrewDepartmentKey,
} from '@crew-credits'
import {
  FULL_IDENTITY_LINK_DEPARTMENTS,
  identityLinkPolicyForDepartments,
  resolveIdentityLinksOnCredits,
  type CreditIdentityDoc,
} from '../../components/crew-credits/sync-credit-identities'

export type ReviewQueuePortfolio = {
  _id: string
  title?: string
  slug?: string
  crewCredits?: CrewCreditValue[]
}

export const IDENTITY_REVIEW_QUEUE_PORTFOLIOS_QUERY = `*[
  _type == "portfolioEntry"
  && defined(crewCredits)
  && count(crewCredits) > 0
  && !(_id in path("drafts.**"))
]{
  _id,
  title,
  "slug": slug.current,
  crewCredits
}`

export const IDENTITY_REVIEW_QUEUE_IDENTITIES_QUERY = `*[_type == "creditIdentity"]{ _id, name, url }`

function portfolioLabel(doc: ReviewQueuePortfolio): string {
  const title = doc.title?.trim()
  if (title) return title
  const slug = doc.slug?.trim()
  if (slug) return slug
  return doc._id
}

/**
 * Count unlinked people slots that would resolve to confidence `review`
 * across all fully linked departments (same total as summing dry-run
 * review queues for every TARGET_DEPARTMENT).
 */
export function countPendingIdentityReviewItems(
  docs: ReviewQueuePortfolio[],
  liveIdentities: CreditIdentityDoc[],
  departments: readonly CrewDepartmentKey[] = FULL_IDENTITY_LINK_DEPARTMENTS,
): number {
  const identityDepartmentsById = buildIdentityDepartmentUsageFromCredits(docs)
  let total = 0

  for (const department of departments) {
    const policy = identityLinkPolicyForDepartments([department])
    // Fresh identity list per department — matches dryRunDepartment().
    const existing = [...liveIdentities]

    for (const doc of docs) {
      const resolved = resolveIdentityLinksOnCredits(doc.crewCredits, existing, policy, {
        identityDepartmentsById,
        portfolioId: doc._id,
        portfolioLabel: portfolioLabel(doc),
      })

      for (const review of resolved.reviewLinks) {
        if (review.department === department) total += 1
      }

      // Dry-run also folds would-create identities into `existing` as it walks
      // portfolios so later slots in the same department pass see them.
      for (const created of resolved.createIdentities) {
        existing.push({_id: created._id, name: created.name, url: created.url})
      }
    }
  }

  return total
}
