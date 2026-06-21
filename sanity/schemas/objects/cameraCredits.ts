/**
 * cameraCredits — Camera department credit fields.
 *
 * Source: content-schema.md §4.2, WordPress vp_portfolio_credits_config() camera
 */

import { defineType } from 'sanity';
import { additionalCreditsField, creditTextField } from './creditsHelpers';

export const cameraCredits = defineType({
  name: 'cameraCredits',
  title: 'Camera Credits',
  type: 'object',

  fields: [
    creditTextField(
      'cam_dop',
      'Director of Photography',
      'Syncs to crewMember taxonomy (role: dop).'
    ),
    creditTextField('cam_camera_op', 'Camera Operator'),
    creditTextField('cam_steadicam_op', 'Steadicam Operator'),
    creditTextField('cam_1st_ac', '1st AC'),
    creditTextField('cam_2nd_ac', '2nd AC'),
    creditTextField('cam_focus_puller', 'Focus Puller'),
    creditTextField('cam_dit', 'DIT'),
    creditTextField('cam_qtake', 'QTake'),
    creditTextField('cam_drone_op', 'Drone Operator'),
    creditTextField('cam_motion_control', 'Motion Control'),
    additionalCreditsField('camera'),
  ],
});
