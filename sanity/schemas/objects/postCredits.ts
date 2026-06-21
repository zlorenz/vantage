/**
 * postCredits — Post-production department credit fields.
 *
 * Source: content-schema.md §4.2, WordPress vp_portfolio_credits_config() post
 */

import { defineType } from 'sanity';
import { additionalCreditsField, creditTextField } from './creditsHelpers';

export const postCredits = defineType({
  name: 'postCredits',
  title: 'Post Credits',
  type: 'object',

  fields: [
    creditTextField('post_post_supervisor', 'Post Supervisor'),
    creditTextField('post_on_set_editor', 'On-Set Editor'),
    creditTextField('post_editor', 'Editor'),
    creditTextField('post_assistant_editor', 'Assistant Editor'),
    creditTextField('post_colorist', 'Colorist'),
    creditTextField('post_sound_design_mix', 'Sound Design & Mix'),
    creditTextField('post_composer', 'Composer'),
    creditTextField('post_voice_over', 'Voice Over'),
    creditTextField('post_vfx', 'VFX'),
    creditTextField('post_online', 'Online'),
    creditTextField('post_3d_animation', '3D Animation'),
    additionalCreditsField('post'),
  ],
});
