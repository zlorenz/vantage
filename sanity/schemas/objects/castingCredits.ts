/**
 * castingCredits — Casting department credit fields.
 *
 * Source: content-schema.md §4.2, WordPress vp_portfolio_credits_config() casting
 */

import { defineType } from 'sanity';
import { additionalCreditsField, creditTextField } from './creditsHelpers';

export const castingCredits = defineType({
  name: 'castingCredits',
  title: 'Casting Credits',
  type: 'object',

  fields: [
    creditTextField('cast_casting_director', 'Casting Director'),
    creditTextField('cast_casting_manager', 'Casting Manager'),
    creditTextField('cast_talent', 'Talent'),
    creditTextField('cast_stunt_coordinator', 'Stunt Coordinator'),
    creditTextField('cast_choreographer', 'Choreographer'),
    creditTextField('cast_animal_wrangler', 'Animal Wrangler'),
    additionalCreditsField('casting'),
  ],
});
