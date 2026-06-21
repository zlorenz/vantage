/**
 * stillsCredits — Stills department credit fields.
 *
 * Source: content-schema.md §4.2, WordPress vp_portfolio_credits_config() stills
 */

import { defineType } from 'sanity';
import { additionalCreditsField, creditTextField } from './creditsHelpers';

export const stillsCredits = defineType({
  name: 'stillsCredits',
  title: 'Stills Credits',
  type: 'object',

  fields: [
    creditTextField('stills_photographer', 'Photographer'),
    creditTextField('stills_photography_producer', 'Photography Producer'),
    creditTextField('stills_kv_art_director', 'KV Art Director'),
    creditTextField('stills_photography_assistant', 'Photography Assistant'),
    creditTextField('stills_photo_talent', 'Photo Talent'),
    additionalCreditsField('stills'),
  ],
});
