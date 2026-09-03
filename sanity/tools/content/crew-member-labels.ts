/**
 * Singular role labels for Crew Members Studio UI (table filters, Roles
 * column, document credit panel). Catalog `role.label` is already singular
 * for almost every role; this map covers Work Library filter-five legacy
 * plurals plus the few catalog labels that are still pluralized.
 */

import {CREW_ROLE_BY_KEY} from '@crew-credits'

const STUDIO_SINGULAR_ROLE_LABELS: Readonly<Record<string, string>> = {
  brand: 'Client',
  director: 'Director',
  dop: 'DOP',
  art_director: 'Art Director',
  editor: 'Editor',
  camera_assistants: 'Camera Assistant',
}

/** Singular display label for a catalog roleKey in Crew Members Studio. */
export function studioRoleLabel(roleKey: string, fallbackRole?: string): string {
  const override = STUDIO_SINGULAR_ROLE_LABELS[roleKey]
  if (override) return override
  return CREW_ROLE_BY_KEY.get(roleKey)?.role.label ?? fallbackRole?.trim() ?? roleKey
}
