/**
 * Shared helpers for portfolio credits department object schemas.
 * Field slugs match WordPress ACF Portfolio Credits (vp_portfolio_credits_config).
 */

import { defineField } from 'sanity';

/** Comma-separated credit names — matches WordPress ACF text credit fields. */
export function creditTextField(name: string, title: string, description?: string) {
  return defineField({
    name,
    title,
    type: 'text',
    rows: 1,
    description:
      description ?? 'Comma-separated names. Matches WordPress ACF credit field format.',
  });
}

/** Additional credits repeater row — maps to *_additional ACF repeaters. */
export function additionalCreditsField(departmentLabel: string) {
  return defineField({
    name: 'additional',
    title: 'Additional Credits',
    type: 'array',
    of: [{ type: 'creditsAdditionalRow' }],
    description: `Extra ${departmentLabel} roles from the WordPress ACF additional-credits repeater.`,
  });
}
