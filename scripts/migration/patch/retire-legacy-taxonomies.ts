/**
 * RETIRED — portfolioEntry.clients / crewMembers fields were removed from the
 * schema (D10). Arrays were already empty after the 2026-07-22 clear pass.
 * Orphan client / crewMember documents remain in the dataset (Vision-only).
 */

console.error(
  'Retired: clients/crewMembers fields no longer exist on portfolioEntry. Nothing to clear.',
)
process.exit(1)
