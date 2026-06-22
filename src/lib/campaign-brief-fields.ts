/**
 * Campaign Brief form field definitions — shared by the API route and form hook.
 * Keys and labels match content-schema.md §5.3 (Gravity Forms audit).
 */

/** All 42 campaign brief field keys (admin label keys). */
export type CampaignBriefFieldKey =
  | 'project_title'
  | 'company_name'
  | 'project_type'
  | 'discovery_source'
  | 'referral_source_other'
  | 'referrer_name'
  | 'contact_name_first'
  | 'contact_name_last'
  | 'contact_job_title'
  | 'contact_email'
  | 'contact_phone'
  | 'campaign_goals'
  | 'key_message'
  | 'target_audience'
  | 'desired_runtime'
  | 'video_tone_style'
  | 'reference_videos'
  | 'campaign_keywords_or_avoidances'
  | 'budget_range'
  | 'distribution_channels'
  | 'target_regions'
  | 'usage_rights_term'
  | 'delivery_deadline'
  | 'delivery_flexibility'
  | 'launch_timing'
  | 'brand_description'
  | 'brand_mission'
  | 'campaign_focus'
  | 'product_name'
  | 'product_key_features'
  | 'market_pain_points'
  | 'product_differentiators'
  | 'deliverables'
  | 'cutdown_durations'
  | 'cutdown_distribution'
  | 'social_channels'
  | 'social_aspect_ratios'
  | 'social_platform_requirements'
  | 'stills_type'
  | 'photography_requirements'
  | 'stills_quantity'
  | 'additional_notes';

/** Human-readable labels for email rendering and form display. */
export const CAMPAIGN_BRIEF_FIELD_LABELS: Record<CampaignBriefFieldKey, string> = {
  project_title: 'Project title',
  company_name: 'Company name',
  project_type: 'What type of project is this?',
  discovery_source: 'How did you hear about us?',
  referral_source_other: 'Please tell us how you found us',
  referrer_name: 'Who referred you?',
  contact_name_first: 'First name',
  contact_name_last: 'Last name',
  contact_job_title: 'Job title',
  contact_email: 'Email',
  contact_phone: 'Phone',
  campaign_goals: 'Primary goals',
  key_message: 'Key message',
  target_audience: 'Target audience',
  desired_runtime: 'Desired runtime',
  video_tone_style: 'Mood and style',
  reference_videos: 'Reference videos',
  campaign_keywords_or_avoidances: 'Themes / buzzwords / slogans',
  budget_range: 'Budget range',
  distribution_channels: 'Distribution channels',
  target_regions: 'Target regions',
  usage_rights_term: 'Usage rights term',
  delivery_deadline: 'Final delivery deadline',
  delivery_flexibility: 'Deadline flexibility',
  launch_timing: 'Launch timing',
  brand_description: 'Brand description',
  brand_mission: 'Company mission',
  campaign_focus: 'Campaign focused on product?',
  product_name: 'Product name',
  product_key_features: 'Key selling points',
  market_pain_points: 'Market pain points',
  product_differentiators: 'Product differentiators',
  deliverables: 'Deliverables needed',
  cutdown_durations: 'Cutdown durations',
  cutdown_distribution: 'Cutdown distribution',
  social_channels: 'Social channels',
  social_aspect_ratios: 'Aspect ratios',
  social_platform_requirements: 'Platform requirements',
  stills_type: 'Stills type',
  photography_requirements: 'Photography requirements',
  stills_quantity: 'Stills quantity',
  additional_notes: 'Additional notes',
};

/** Step metadata for the multi-step form and email grouping. */
export interface CampaignBriefStepConfig {
  step: number;
  title: string;
  fields: CampaignBriefFieldKey[];
}

/** Seven form steps — field order matches content-schema.md §5.2. */
export const CAMPAIGN_BRIEF_STEPS: CampaignBriefStepConfig[] = [
  {
    step: 1,
    title: 'Basics',
    fields: [
      'project_title',
      'company_name',
      'project_type',
      'discovery_source',
      'referral_source_other',
      'referrer_name',
    ],
  },
  {
    step: 2,
    title: 'Contact',
    fields: [
      'contact_name_first',
      'contact_name_last',
      'contact_job_title',
      'contact_email',
      'contact_phone',
    ],
  },
  {
    step: 3,
    title: 'Campaign Goals',
    fields: [
      'campaign_goals',
      'key_message',
      'target_audience',
      'desired_runtime',
      'video_tone_style',
      'reference_videos',
      'campaign_keywords_or_avoidances',
      'budget_range',
    ],
  },
  {
    step: 4,
    title: 'Timeline & Release',
    fields: [
      'distribution_channels',
      'target_regions',
      'usage_rights_term',
      'delivery_deadline',
      'delivery_flexibility',
      'launch_timing',
    ],
  },
  {
    step: 5,
    title: 'Brand / Product',
    fields: [
      'brand_description',
      'brand_mission',
      'campaign_focus',
      'product_name',
      'product_key_features',
      'market_pain_points',
      'product_differentiators',
    ],
  },
  {
    step: 6,
    title: 'Deliverables',
    fields: [
      'deliverables',
      'cutdown_durations',
      'cutdown_distribution',
      'social_channels',
      'social_aspect_ratios',
      'social_platform_requirements',
      'stills_type',
      'photography_requirements',
      'stills_quantity',
    ],
  },
  {
    step: 7,
    title: 'Final Notes',
    fields: ['additional_notes'],
  },
];

/** Required fields — validated on step navigation and final submit. */
export const CAMPAIGN_BRIEF_REQUIRED_FIELDS: CampaignBriefFieldKey[] = [
  'project_title',
  'company_name',
  'contact_name_first',
  'contact_name_last',
  'contact_email',
  'budget_range',
  'campaign_focus',
];

/** Form description shown above the fields (content-schema.md §5.1). */
export const CAMPAIGN_BRIEF_FORM_DESCRIPTION =
  'This briefing form helps us understand your brand, product, and upcoming video campaign. The more you can provide, the more effectively we can shape the creative direction and production approach. If you\'re unsure about anything, feel free to leave them blank — our team will guide you through next steps.';

/** Success message after submission. */
export const CAMPAIGN_BRIEF_SUCCESS_MESSAGE =
  "Thanks for your brief — we'll be in touch shortly.";

/** Select/radio option values — exact Gravity Forms audit labels. */
export const PROJECT_TYPE_OPTIONS = [
  'Product video',
  'Commercial spot',
  'Brand film',
  'Corporate video',
  'Social media campaign',
  'Other',
] as const;

export const DISCOVERY_SOURCE_OPTIONS = [
  'Google',
  'Vimeo / YouTube',
  'Instagram',
  'LinkedIn',
  'Facebook',
  'Colleague referral',
  'Agency referral',
  'Partner referral',
  'Industry event',
  'Previous client',
  'Other',
] as const;

/** Discovery sources that reveal the referrer_name field. */
export const REFERRAL_DISCOVERY_SOURCES: ReadonlySet<string> = new Set([
  'Colleague referral',
  'Agency referral',
  'Partner referral',
]);

export const BUDGET_RANGE_OPTIONS = [
  'Under $80K',
  '$80K–$150K',
  '$150K–$200K',
  '$200K–$250K',
  '$250K+ USD',
] as const;

export const DELIVERY_FLEXIBILITY_OPTIONS = ['Fixed', 'Flexible', 'Not sure yet'] as const;

export const CAMPAIGN_FOCUS_OPTIONS = ['Yes', 'No'] as const;

export const DELIVERABLES_OPTIONS = [
  'Main hero film',
  'Cutdowns',
  'Social versions',
  'Key visuals',
  'Motion graphics',
  'Other',
] as const;

/** Max briefing materials uploads per submission. */
export const CAMPAIGN_BRIEF_MAX_FILES = 10;

/** Allowed file extensions for briefing materials upload. */
export const CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS = [
  'pdf',
  'ppt',
  'pptx',
  'key',
  'doc',
  'docx',
  'pages',
  'xls',
  'xlsx',
  'numbers',
  'zip',
  'jpg',
  'jpeg',
  'png',
] as const;
