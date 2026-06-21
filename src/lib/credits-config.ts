/**
 * Portfolio credits department configuration.
 * Field slugs and role labels match WordPress vp_portfolio_credits_config().
 */

import type { CreditsAdditionalRow } from '@/types/sanity';

export interface CreditFieldConfig {
  slug: string;
  label: string;
}

export interface CreditDepartmentConfig {
  key: keyof typeof DEPARTMENT_LABELS;
  label: string;
  fields: CreditFieldConfig[];
  repeater: string;
}

export const DEPARTMENT_LABELS = {
  production: 'Production',
  camera: 'Camera',
  ge: 'G&E',
  art: 'Art',
  casting: 'Casting',
  stills: 'Stills',
  post: 'Post',
} as const;

export const CREDITS_CONFIG: CreditDepartmentConfig[] = [
  {
    key: 'production',
    label: DEPARTMENT_LABELS.production,
    repeater: 'prod_additional',
    fields: [
      { slug: 'prod_brand', label: 'Brand' },
      { slug: 'prod_agency', label: 'Agency' },
      { slug: 'prod_production_company', label: 'Production Company' },
      { slug: 'prod_production_service', label: 'Production Service' },
      { slug: 'prod_executive_producer', label: 'EP' },
      { slug: 'prod_director', label: 'Director' },
      { slug: 'prod_producer', label: 'Producer' },
      { slug: 'prod_line_producer', label: 'Line Producer' },
      { slug: 'prod_production_manager', label: 'Production Manager' },
      { slug: 'prod_production_coordinator', label: 'Production Coordinator' },
      { slug: 'prod_1st_ad', label: '1st AD' },
      { slug: 'prod_2nd_ad', label: '2nd AD' },
      { slug: 'prod_production_assistant', label: 'PA' },
      { slug: 'prod_product_technician', label: 'Product Technician' },
      { slug: 'prod_account_manager', label: 'Account Manager' },
      { slug: 'prod_transport', label: 'Transport' },
      { slug: 'prod_chaperone', label: 'Chaperone' },
      { slug: 'prod_bts', label: 'BTS' },
    ],
  },
  {
    key: 'camera',
    label: DEPARTMENT_LABELS.camera,
    repeater: 'cam_additional',
    fields: [
      { slug: 'cam_dop', label: 'DOP' },
      { slug: 'cam_camera_op', label: 'Camera Op' },
      { slug: 'cam_steadicam_op', label: 'Steadicam Op' },
      { slug: 'cam_1st_ac', label: '1st AC' },
      { slug: 'cam_2nd_ac', label: '2nd AC' },
      { slug: 'cam_focus_puller', label: 'Focus Puller' },
      { slug: 'cam_dit', label: 'DIT' },
      { slug: 'cam_qtake', label: 'QTake' },
      { slug: 'cam_drone_op', label: 'Drone Op' },
      { slug: 'cam_motion_control', label: 'Motion Control' },
    ],
  },
  {
    key: 'ge',
    label: DEPARTMENT_LABELS.ge,
    repeater: 'ge_additional',
    fields: [
      { slug: 'ge_rental_house', label: 'Rental House' },
      { slug: 'ge_gaffer', label: 'Gaffer' },
      { slug: 'ge_key_grip', label: 'Key Grip' },
      { slug: 'ge_grip', label: 'Grip' },
      { slug: 'ge_electrician', label: 'Electrician' },
    ],
  },
  {
    key: 'art',
    label: DEPARTMENT_LABELS.art,
    repeater: 'art_additional',
    fields: [
      { slug: 'art_production_designer', label: 'Production Designer' },
      { slug: 'art_art_director', label: 'Art Director' },
      { slug: 'art_art_assistant', label: 'Art Assistant' },
      { slug: 'art_props_master', label: 'Props Master' },
      { slug: 'art_wardrobe', label: 'Wardrobe' },
      { slug: 'art_hair_makeup', label: 'Hair & Makeup' },
      { slug: 'art_location_manager', label: 'Location Manager' },
      { slug: 'art_storyboard_artist', label: 'Storyboards' },
    ],
  },
  {
    key: 'casting',
    label: DEPARTMENT_LABELS.casting,
    repeater: 'cast_additional',
    fields: [
      { slug: 'cast_casting_director', label: 'Casting Director' },
      { slug: 'cast_casting_manager', label: 'Casting Manager' },
      { slug: 'cast_talent', label: 'Talent' },
      { slug: 'cast_stunt_coordinator', label: 'Stunt Coordinator' },
      { slug: 'cast_choreographer', label: 'Choreographer' },
      { slug: 'cast_animal_wrangler', label: 'Animal Wrangler' },
    ],
  },
  {
    key: 'stills',
    label: DEPARTMENT_LABELS.stills,
    repeater: 'stills_additional',
    fields: [
      { slug: 'stills_photographer', label: 'Photographer' },
      { slug: 'stills_photography_producer', label: 'Photography Producer' },
      { slug: 'stills_kv_art_director', label: 'KV Art Director' },
      { slug: 'stills_photography_assistant', label: 'Photography Assistant' },
      { slug: 'stills_photo_talent', label: 'Photo Talent' },
    ],
  },
  {
    key: 'post',
    label: DEPARTMENT_LABELS.post,
    repeater: 'post_additional',
    fields: [
      { slug: 'post_post_supervisor', label: 'Post Supervisor' },
      { slug: 'post_on_set_editor', label: 'On-Set Editor' },
      { slug: 'post_editor', label: 'Editor' },
      { slug: 'post_assistant_editor', label: 'Assistant Editors' },
      { slug: 'post_colorist', label: 'Colorist' },
      { slug: 'post_sound_design_mix', label: 'Sound Design & Mix' },
      { slug: 'post_composer', label: 'Composer' },
      { slug: 'post_voice_over', label: 'Voice Over' },
      { slug: 'post_vfx', label: 'VFX' },
      { slug: 'post_online', label: 'Online' },
      { slug: 'post_3d_animation', label: '3D Animation' },
    ],
  },
];

/** Pluralize role label when names contain multiple comma-separated entries. */
export function pluralizeCreditRole(role: string, names: string): string {
  if (!names.includes(',')) return role;

  const irregular: Record<string, string> = {
    'Production Company': 'Production Companies',
    'Production Service': 'Production Services',
    Talent: 'Talent',
    Transport: 'Transport',
    'G&E': 'G&E',
    BTS: 'BTS',
    'Hair & Makeup': 'Hair & Makeup',
    VFX: 'VFX',
    Storyboards: 'Storyboards',
    'Assistant Editors': 'Assistant Editors',
    'Sound Design & Mix': 'Sound Design & Mix',
  };
  if (irregular[role]) return irregular[role];

  const abbrevPlural: Record<string, string> = {
    '1st AD': '1st ADs',
    '2nd AD': '2nd ADs',
    PA: 'PAs',
    EP: 'EPs',
    DOP: 'DOPs',
    '1st AC': '1st ACs',
    '2nd AC': '2nd ACs',
    DIT: 'DITs',
  };
  if (abbrevPlural[role]) return abbrevPlural[role];

  if (/s$|x$|ch$|sh$/i.test(role)) return role;
  return `${role}s`;
}

export interface CreditPair {
  role: string;
  names: string;
}

export function getDepartmentCreditPairs(
  department: Record<string, string | CreditsAdditionalRow[] | undefined> | undefined,
  config: CreditDepartmentConfig,
): CreditPair[] {
  if (!department) return [];

  const pairs: CreditPair[] = [];

  for (const field of config.fields) {
    const val = String(department[field.slug] ?? '').trim();
    if (val) {
      pairs.push({
        role: pluralizeCreditRole(field.label, val),
        names: val,
      });
    }
  }

  const additional = department[config.repeater];
  if (Array.isArray(additional)) {
    for (const row of additional) {
      const role = String(row.role ?? '').trim();
      const names = String(row.names ?? '').trim();
      if (role && names) {
        pairs.push({ role, names });
      }
    }
  }

  return pairs;
}
