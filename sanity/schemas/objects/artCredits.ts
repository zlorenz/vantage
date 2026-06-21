/**
 * artCredits — Art department credit fields.
 *
 * Source: content-schema.md §4.2, WordPress vp_portfolio_credits_config() art
 */

import { defineType } from 'sanity';
import { additionalCreditsField, creditTextField } from './creditsHelpers';

export const artCredits = defineType({
  name: 'artCredits',
  title: 'Art Credits',
  type: 'object',

  fields: [
    creditTextField('art_production_designer', 'Production Designer'),
    creditTextField(
      'art_art_director',
      'Art Director',
      'Syncs to crewMember taxonomy (role: art-director).'
    ),
    creditTextField('art_art_assistant', 'Art Assistant'),
    creditTextField('art_props_master', 'Props Master'),
    creditTextField('art_wardrobe', 'Wardrobe'),
    creditTextField('art_hair_makeup', 'Hair & Makeup'),
    creditTextField('art_location_manager', 'Location Manager'),
    creditTextField('art_storyboard_artist', 'Storyboard Artist'),
    additionalCreditsField('art'),
  ],
});
