/** Mirrors vp_portfolio_credits_config() from WordPress functions.php */

export const CREDITS_CONFIG = {
  production: {
    fields: [
      'prod_brand',
      'prod_agency',
      'prod_production_company',
      'prod_production_service',
      'prod_executive_producer',
      'prod_director',
      'prod_producer',
      'prod_line_producer',
      'prod_production_manager',
      'prod_production_coordinator',
      'prod_1st_ad',
      'prod_2nd_ad',
      'prod_production_assistant',
      'prod_product_technician',
      'prod_account_manager',
      'prod_transport',
      'prod_chaperone',
      'prod_bts',
    ],
    repeater: 'prod_additional',
  },
  camera: {
    fields: [
      'cam_dop',
      'cam_camera_op',
      'cam_steadicam_op',
      'cam_1st_ac',
      'cam_2nd_ac',
      'cam_focus_puller',
      'cam_dit',
      'cam_qtake',
      'cam_drone_op',
      'cam_motion_control',
    ],
    repeater: 'cam_additional',
  },
  ge: {
    fields: ['ge_rental_house', 'ge_gaffer', 'ge_key_grip', 'ge_grip', 'ge_electrician'],
    repeater: 'ge_additional',
  },
  art: {
    fields: [
      'art_production_designer',
      'art_art_director',
      'art_art_assistant',
      'art_props_master',
      'art_wardrobe',
      'art_hair_makeup',
      'art_location_manager',
      'art_storyboard_artist',
    ],
    repeater: 'art_additional',
  },
  casting: {
    fields: [
      'cast_casting_director',
      'cast_casting_manager',
      'cast_talent',
      'cast_stunt_coordinator',
      'cast_choreographer',
      'cast_animal_wrangler',
    ],
    repeater: 'cast_additional',
  },
  stills: {
    fields: [
      'stills_photographer',
      'stills_photography_producer',
      'stills_kv_art_director',
      'stills_photography_assistant',
      'stills_photo_talent',
    ],
    repeater: 'stills_additional',
  },
  post: {
    fields: [
      'post_post_supervisor',
      'post_on_set_editor',
      'post_editor',
      'post_assistant_editor',
      'post_colorist',
      'post_sound_design_mix',
      'post_composer',
      'post_voice_over',
      'post_vfx',
      'post_online',
      'post_3d_animation',
    ],
    repeater: 'post_additional',
  },
} as const;

export type CreditsDepartment = keyof typeof CREDITS_CONFIG;

export function buildCredits(meta: Record<string, string>): Record<string, Record<string, unknown>> {
  const credits: Record<string, Record<string, unknown>> = {};

  for (const [dept, config] of Object.entries(CREDITS_CONFIG)) {
    const deptData: Record<string, unknown> = {};
    let hasData = false;

    for (const field of config.fields) {
      const val = (meta[field] ?? '').trim();
      if (val) {
        deptData[field] = val;
        hasData = true;
      }
    }

    const additionalKey = `${config.repeater}`;
    const count = Number(meta[additionalKey] ?? 0);
    if (count > 0) {
      const rows: { role: string; names: string }[] = [];
      for (let i = 0; i < count; i++) {
        const role = (meta[`${additionalKey}_${i}_role`] ?? '').trim();
        const names = (meta[`${additionalKey}_${i}_names`] ?? '').trim();
        if (role || names) rows.push({ role, names });
      }
      if (rows.length) {
        deptData.additional = rows;
        hasData = true;
      }
    }

    if (hasData) credits[dept] = deptData;
  }

  return credits;
}
