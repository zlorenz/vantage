/**
 * Canonical crew department and role catalog.
 *
 * Single source of truth for:
 * - Sanity schema options / validation
 * - CSV template generation
 * - CSV role matching / aliases
 * - Frontend ordering, labels, and pluralization
 * - Legacy field → structured credit migration
 */

import type {CrewDepartmentDefinition, CrewDepartmentKey, CrewRoleDefinition} from './types'

export const CREW_DEPARTMENTS: CrewDepartmentDefinition[] = [
  {
    key: 'production',
    label: 'Production',
    legacyRepeater: 'prod_additional',
    roles: [
      {
        key: 'brand',
        label: 'Brand',
        pluralLabel: 'Brand',
        legacyField: 'prod_brand',
        aliases: ['client', 'brand/client', 'brand client'],
      },
      {
        key: 'agency',
        label: 'Agency',
        pluralLabel: 'Agencies',
        legacyField: 'prod_agency',
        aliases: [],
      },
      {
        key: 'production_company',
        label: 'Production Company',
        pluralLabel: 'Production Companies',
        legacyField: 'prod_production_company',
        aliases: ['prodco', 'prod co', 'production co'],
      },
      {
        key: 'production_service',
        label: 'Production Service',
        pluralLabel: 'Production Services',
        legacyField: 'prod_production_service',
        aliases: ['production services'],
      },
      {
        key: 'ep',
        label: 'EP',
        pluralLabel: 'EPs',
        legacyField: 'prod_executive_producer',
        aliases: ['executive producer', 'exec producer', 'executive producers'],
      },
      {
        key: 'director',
        label: 'Director',
        pluralLabel: 'Directors',
        legacyField: 'prod_director',
        aliases: [],
      },
      {
        key: 'creative_director',
        label: 'Creative Director',
        pluralLabel: 'Creative Directors',
        legacyField: 'prod_creative_director',
        aliases: ['cd'],
      },
      {
        key: 'producer',
        label: 'Producer',
        pluralLabel: 'Producers',
        legacyField: 'prod_producer',
        aliases: [],
      },
      {
        key: 'line_producer',
        label: 'Line Producer',
        pluralLabel: 'Line Producers',
        legacyField: 'prod_line_producer',
        aliases: [],
      },
      {
        key: 'production_manager',
        label: 'Production Manager',
        pluralLabel: 'Production Managers',
        legacyField: 'prod_production_manager',
        aliases: ['prod manager'],
      },
      {
        key: 'production_coordinator',
        label: 'Production Coordinator',
        pluralLabel: 'Production Coordinators',
        legacyField: 'prod_production_coordinator',
        aliases: [],
      },
      {
        key: '1st_ad',
        label: '1st AD',
        pluralLabel: '1st ADs',
        legacyField: 'prod_1st_ad',
        aliases: ['first ad', '1st assistant director', 'first assistant director', '1st a.d.'],
      },
      {
        key: '2nd_ad',
        label: '2nd AD',
        pluralLabel: '2nd ADs',
        legacyField: 'prod_2nd_ad',
        aliases: ['second ad', '2nd assistant director', 'second assistant director', '2nd a.d.'],
      },
      {
        key: 'pa',
        label: 'PA',
        pluralLabel: 'PAs',
        legacyField: 'prod_production_assistant',
        aliases: ['production assistant', 'production assistants', 'pas', 'runner', 'runners'],
      },
      {
        key: 'product_technician',
        label: 'Product Technician',
        pluralLabel: 'Product Technicians',
        legacyField: 'prod_product_technician',
        aliases: ['product tech'],
      },
      {
        key: 'account_manager',
        label: 'Account Manager',
        pluralLabel: 'Account Managers',
        legacyField: 'prod_account_manager',
        aliases: [],
      },
      {
        key: 'transport',
        label: 'Transport',
        pluralLabel: 'Transport',
        legacyField: 'prod_transport',
        aliases: ['transportation', 'driver', 'drivers'],
      },
      {
        key: 'chaperone',
        label: 'Chaperone',
        pluralLabel: 'Chaperones',
        legacyField: 'prod_chaperone',
        aliases: [],
      },
      {
        key: 'bts',
        label: 'BTS',
        pluralLabel: 'BTS',
        legacyField: 'prod_bts',
        aliases: ['behind the scenes', 'behind-the-scenes'],
      },
      {
        key: 'catering',
        label: 'Catering',
        pluralLabel: 'Catering',
        legacyField: 'prod_catering',
        aliases: ['craft service', 'craft services', 'crafty'],
      },
      {
        key: 'sound_recordist',
        label: 'Sound Recordist',
        pluralLabel: 'Sound Recordists',
        legacyField: 'prod_sound_recordist',
        aliases: [
          'soundman',
          'sound man',
          'sound recorder',
          'production sound',
          'production sound mixer',
        ],
      },
    ],
  },
  {
    key: 'camera',
    label: 'Camera',
    legacyRepeater: 'cam_additional',
    roles: [
      {
        key: 'dop',
        label: 'DOP',
        pluralLabel: 'DOPs',
        legacyField: 'cam_dop',
        aliases: ['dp', 'dop', 'director of photography', 'cinematographer'],
      },
      {
        key: 'camera_op',
        label: 'Camera Op',
        pluralLabel: 'Camera Ops',
        legacyField: 'cam_camera_op',
        aliases: ['camera operator', 'cam op', 'camop', 'camera ops'],
      },
      {
        key: 'steadicam_op',
        label: 'Steadicam Op',
        pluralLabel: 'Steadicam Ops',
        legacyField: 'cam_steadicam_op',
        aliases: ['steadicam operator', 'steadicam', 'steadi cam'],
      },
      {
        key: '1st_ac',
        label: '1st AC',
        pluralLabel: '1st ACs',
        legacyField: 'cam_1st_ac',
        aliases: ['first ac', '1st assistant camera', 'first assistant camera', '1st assistant cam'],
      },
      {
        key: '2nd_ac',
        label: '2nd AC',
        pluralLabel: '2nd ACs',
        legacyField: 'cam_2nd_ac',
        aliases: ['second ac', '2nd assistant camera', 'second assistant camera', '2nd assistant cam'],
      },
      {
        key: 'focus_puller',
        label: 'Focus Puller',
        pluralLabel: 'Focus Pullers',
        legacyField: 'cam_focus_puller',
        aliases: [],
      },
      {
        key: 'camera_assistants',
        label: 'Camera Assistants',
        pluralLabel: 'Camera Assistants',
        legacyField: 'cam_camera_assistants',
        aliases: ['camera assistant', 'cam assistants', 'cam assistant'],
      },
      {
        key: 'dit',
        label: 'DIT',
        pluralLabel: 'DITs',
        legacyField: 'cam_dit',
        aliases: ['digital imaging technician'],
      },
      {
        key: 'qtake',
        label: 'QTake',
        pluralLabel: 'QTake',
        legacyField: 'cam_qtake',
        aliases: ['q-take', 'q take'],
      },
      {
        key: 'drone_op',
        label: 'Drone Op',
        pluralLabel: 'Drone Ops',
        legacyField: 'cam_drone_op',
        aliases: ['drone operator', 'drone pilot', 'uav'],
      },
      {
        key: 'motion_control',
        label: 'Motion Control',
        pluralLabel: 'Motion Control',
        legacyField: 'cam_motion_control',
        aliases: ['moco', 'mo-co', 'motion control op'],
      },
    ],
  },
  {
    key: 'ge',
    label: 'G&E',
    legacyRepeater: 'ge_additional',
    roles: [
      {
        key: 'rental_house',
        label: 'Rental House',
        pluralLabel: 'Rental Houses',
        legacyField: 'ge_rental_house',
        aliases: [
          'equipment rental',
          'camera rental',
          'grip and lighting',
          'grip & lighting',
        ],
      },
      {
        key: 'gaffer',
        label: 'Gaffer',
        pluralLabel: 'Gaffers',
        legacyField: 'ge_gaffer',
        aliases: [],
      },
      {
        key: 'key_grip',
        label: 'Key Grip',
        pluralLabel: 'Key Grips',
        legacyField: 'ge_key_grip',
        aliases: [],
      },
      {
        key: 'grip',
        label: 'Grip',
        pluralLabel: 'Grips',
        legacyField: 'ge_grip',
        aliases: [],
      },
      {
        key: 'electrician',
        label: 'Electrician',
        pluralLabel: 'Electricians',
        legacyField: 'ge_electrician',
        aliases: [
          'electric',
          'lighting technician',
          'lighting tech',
          'spark',
          'sparks',
          'juicer',
        ],
      },
    ],
  },
  {
    key: 'art',
    label: 'Art',
    legacyRepeater: 'art_additional',
    roles: [
      {
        key: 'production_designer',
        label: 'Production Designer',
        pluralLabel: 'Production Designers',
        legacyField: 'art_production_designer',
        aliases: ['pd'],
      },
      {
        key: 'art_director',
        label: 'Art Director',
        pluralLabel: 'Art Directors',
        legacyField: 'art_art_director',
        aliases: [],
      },
      {
        key: 'art_assistant',
        label: 'Art Assistant',
        pluralLabel: 'Art Assistants',
        legacyField: 'art_art_assistant',
        aliases: ['art dept assistant'],
      },
      {
        key: 'props_master',
        label: 'Props Master',
        pluralLabel: 'Props Masters',
        legacyField: 'art_props_master',
        aliases: ['props', 'prop master', 'property master'],
      },
      {
        key: 'wardrobe',
        label: 'Wardrobe',
        pluralLabel: 'Wardrobe',
        legacyField: 'art_wardrobe',
        aliases: ['costume', 'costumes', 'stylist'],
      },
      {
        key: 'wardrobe_assistant',
        label: 'Wardrobe Assistant',
        pluralLabel: 'Wardrobe Assistants',
        legacyField: 'art_wardrobe_assistant',
        aliases: ['wardrobe asst', 'costume assistant'],
      },
      {
        key: 'hair_makeup',
        label: 'Hair & Makeup',
        pluralLabel: 'Hair & Makeup',
        legacyField: 'art_hair_makeup',
        aliases: ['hair and makeup', 'hmu', 'makeup', 'makeup artist', 'hair & make-up'],
      },
      {
        key: 'location_manager',
        label: 'Location Manager',
        pluralLabel: 'Location Managers',
        legacyField: 'art_location_manager',
        aliases: ['locations'],
      },
      {
        key: 'storyboards',
        label: 'Storyboards',
        pluralLabel: 'Storyboards',
        legacyField: 'art_storyboard_artist',
        aliases: ['storyboard', 'storyboard artist', 'storyboard artists'],
      },
    ],
  },
  {
    key: 'casting',
    label: 'Casting',
    legacyRepeater: 'cast_additional',
    roles: [
      {
        key: 'casting_director',
        label: 'Casting Director',
        pluralLabel: 'Casting Directors',
        legacyField: 'cast_casting_director',
        aliases: [],
      },
      {
        key: 'casting_manager',
        label: 'Casting Manager',
        pluralLabel: 'Casting Managers',
        legacyField: 'cast_casting_manager',
        aliases: [],
      },
      {
        key: 'talent',
        label: 'Talent',
        pluralLabel: 'Talent',
        legacyField: 'cast_talent',
        aliases: ['actor', 'actors'],
      },
      {
        key: 'stunt_coordinator',
        label: 'Stunt Coordinator',
        pluralLabel: 'Stunt Coordinators',
        legacyField: 'cast_stunt_coordinator',
        aliases: ['stunts'],
      },
      {
        key: 'choreographer',
        label: 'Choreographer',
        pluralLabel: 'Choreographers',
        legacyField: 'cast_choreographer',
        aliases: [],
      },
      {
        key: 'animal_wrangler',
        label: 'Animal Wrangler',
        pluralLabel: 'Animal Wranglers',
        legacyField: 'cast_animal_wrangler',
        aliases: ['animal handler'],
      },
    ],
  },
  {
    key: 'stills',
    label: 'Stills',
    legacyRepeater: 'stills_additional',
    roles: [
      {
        key: 'photographer',
        label: 'Photographer',
        pluralLabel: 'Photographers',
        legacyField: 'stills_photographer',
        aliases: ['still photographer', 'stills photographer'],
      },
      {
        key: 'photography_producer',
        label: 'Photography Producer',
        pluralLabel: 'Photography Producers',
        legacyField: 'stills_photography_producer',
        aliases: ['photo producer', 'stills producer'],
      },
      {
        key: 'kv_art_director',
        label: 'KV Art Director',
        pluralLabel: 'KV Art Directors',
        legacyField: 'stills_kv_art_director',
        aliases: ['key visual art director', 'kv ad'],
      },
      {
        key: 'photography_assistant',
        label: 'Photography Assistant',
        pluralLabel: 'Photography Assistants',
        legacyField: 'stills_photography_assistant',
        aliases: ['photo assistant', 'stills assistant'],
      },
      {
        key: 'photo_talent',
        label: 'Photo Talent',
        pluralLabel: 'Photo Talent',
        legacyField: 'stills_photo_talent',
        aliases: ['stills talent', 'model', 'models'],
      },
    ],
  },
  {
    key: 'post',
    label: 'Post',
    legacyRepeater: 'post_additional',
    roles: [
      {
        key: 'post_supervisor',
        label: 'Post Supervisor',
        pluralLabel: 'Post Supervisors',
        legacyField: 'post_post_supervisor',
        aliases: ['post production supervisor', 'post producer', 'post-producer'],
      },
      {
        key: 'post_house',
        label: 'Post House',
        pluralLabel: 'Post Houses',
        legacyField: 'post_post_house',
        aliases: ['post facility', 'post-production house'],
      },
      {
        key: 'on_set_editor',
        label: 'On-Set Editor',
        pluralLabel: 'On-Set Editors',
        legacyField: 'post_on_set_editor',
        aliases: ['onset editor', 'on set editor', 'offline editor'],
      },
      {
        key: 'editor',
        label: 'Editor',
        pluralLabel: 'Editors',
        legacyField: 'post_editor',
        aliases: ['edit', 'film editor'],
      },
      {
        key: 'assistant_editors',
        label: 'Assistant Editor',
        pluralLabel: 'Assistant Editors',
        legacyField: 'post_assistant_editor',
        aliases: ['assistant editor'],
      },
      {
        key: 'colorist',
        label: 'Colorist',
        pluralLabel: 'Colorists',
        legacyField: 'post_colorist',
        aliases: ['colourist'],
      },
      {
        key: 'sound_design_mix',
        label: 'Sound Design & Mix',
        pluralLabel: 'Sound Design & Mix',
        legacyField: 'post_sound_design_mix',
        // "sound engineer" is dept-scoped in resolveStandardRole (post → here, production → sound_recordist)
        aliases: ['sound design', 'sound mix', 'sound designer', 'sound mixer', 'audio'],
      },
      {
        key: 'composer',
        label: 'Composer',
        pluralLabel: 'Composers',
        legacyField: 'post_composer',
        aliases: ['music', 'score'],
      },
      {
        key: 'voice_over',
        label: 'Voice Over',
        pluralLabel: 'Voice Over',
        legacyField: 'post_voice_over',
        aliases: ['vo', 'voiceover', 'voice-over', 'narrator'],
      },
      {
        key: 'vfx',
        label: 'VFX',
        pluralLabel: 'VFX',
        legacyField: 'post_vfx',
        aliases: ['visual effects', 'visual fx'],
      },
      {
        key: 'online',
        label: 'Online',
        pluralLabel: 'Online',
        legacyField: 'post_online',
        aliases: ['online editor', 'online edit'],
      },
      {
        key: 'motion_graphics',
        label: 'Motion Graphics',
        pluralLabel: 'Motion Graphics',
        legacyField: 'post_motion_graphics',
        aliases: [
          'motion graphic artist',
          'motion graphics artist',
          'motion graphic',
          'graphic design',
          'gfx',
        ],
      },
      {
        key: '3d_animation',
        label: '3D Animation',
        pluralLabel: '3D Animations',
        legacyField: 'post_3d_animation',
        aliases: ['3d', '3d animator', '3d animators', 'cgi'],
      },
    ],
  },
]

export const CREW_DEPARTMENT_KEYS = CREW_DEPARTMENTS.map((d) => d.key)

export const CREW_DEPARTMENT_BY_KEY: Record<CrewDepartmentKey, CrewDepartmentDefinition> =
  Object.fromEntries(CREW_DEPARTMENTS.map((d) => [d.key, d])) as Record<
    CrewDepartmentKey,
    CrewDepartmentDefinition
  >

export interface ResolvedCrewRole {
  departmentKey: CrewDepartmentKey
  departmentLabel: string
  role: CrewRoleDefinition
  sortIndex: number
}

/** Flat list of every predefined role with department context and catalog order. */
export const CREW_ROLES_FLAT: ResolvedCrewRole[] = CREW_DEPARTMENTS.flatMap((dept, deptIndex) =>
  dept.roles.map((role, roleIndex) => ({
    departmentKey: dept.key,
    departmentLabel: dept.label,
    role,
    sortIndex: deptIndex * 1000 + roleIndex,
  })),
)

export const CREW_ROLE_BY_KEY = new Map(
  CREW_ROLES_FLAT.map((entry) => [entry.role.key, entry] as const),
)

export const CREW_ROLE_BY_LEGACY_FIELD = new Map(
  CREW_ROLES_FLAT.map((entry) => [entry.role.legacyField, entry] as const),
)

export function getDepartmentLabel(key: CrewDepartmentKey): string {
  return CREW_DEPARTMENT_BY_KEY[key]?.label ?? key
}

export function getRoleDisplayLabel(
  roleKey: string | undefined,
  fallbackLabel: string,
  peopleCount: number,
): string {
  if (!roleKey) return fallbackLabel
  const resolved = CREW_ROLE_BY_KEY.get(roleKey)
  if (!resolved) return fallbackLabel
  return peopleCount > 1 ? resolved.role.pluralLabel : resolved.role.label
}

/**
 * Recurring custom roles included in the downloadable CSV template.
 * Kept out of the standard catalog on purpose — free-form `isCustomRole` rows.
 * Labels must match Studio / CSV canonical spellings (see resolveCustomRoleCanonical).
 */
export const CREW_CUSTOM_TEMPLATE_ROLES: {department: CrewDepartmentKey; label: string}[] = [
  {department: 'production', label: 'Agency Producer'},
  {department: 'production', label: 'Assistant Producer'},
  {department: 'production', label: 'Head of Production'},
  {department: 'production', label: 'Assistant Production Manager'},
  {department: 'production', label: "Director's Assistant"},
  {department: 'production', label: 'Boom Op'},
  {department: 'production', label: 'Medic'},
  {department: 'camera', label: 'Live-Stream Technician'},
  {department: 'ge', label: 'Best Boy Electric'},
  {department: 'ge', label: 'Best Boy Grip'},
  {department: 'post', label: 'Post PA'},
]

