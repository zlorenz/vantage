/**
 * geCredits — G&E department credit fields.
 *
 * Source: content-schema.md §4.2, WordPress vp_portfolio_credits_config() ge
 */

import { defineType } from 'sanity';
import { additionalCreditsField, creditTextField } from './creditsHelpers';

export const geCredits = defineType({
  name: 'geCredits',
  title: 'G&E Credits',
  type: 'object',

  fields: [
    creditTextField('ge_rental_house', 'Rental House'),
    creditTextField('ge_gaffer', 'Gaffer'),
    creditTextField('ge_key_grip', 'Key Grip'),
    creditTextField('ge_grip', 'Grip'),
    creditTextField('ge_electrician', 'Electrician'),
    additionalCreditsField('G&E'),
  ],
});
