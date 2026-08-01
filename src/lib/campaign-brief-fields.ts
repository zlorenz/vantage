/**
 * Campaign Brief form field definitions — shared by the API route and form hook.
 * Three-step branching brief: Contact → Campaign Details → Final Notes.
 */

/** String / array field keys submitted with the brief. */
export type CampaignBriefFieldKey =
  | 'contact_name_first'
  | 'contact_name_last'
  | 'company_name'
  | 'contact_email'
  | 'discovery_source'
  | 'campaign_title'
  | 'campaign_type'
  | 'brand_description'
  | 'product_description'
  | 'campaign_description'
  | 'target_audience'
  | 'reference_videos'
  | 'delivery_deadline'
  | 'delivery_deadline_unknown'
  | 'delivery_deadline_note'
  | 'extra_deliverables'
  | 'extra_deliverables_other_note'
  | 'budget_range'
  | 'project_description'
  | 'shoot_event_date'
  | 'shoot_event_date_unknown'
  | 'shoot_event_date_note'
  | 'production_scope'
  | 'social_channels'
  | 'aspect_ratios'
  | 'additional_notes';

/** Checkbox-group field keys. */
export type CampaignBriefArrayFieldKey =
  | 'extra_deliverables'
  | 'social_channels'
  | 'aspect_ratios';

/** Human-readable EN labels for email rendering and default form display. */
export const CAMPAIGN_BRIEF_FIELD_LABELS: Record<CampaignBriefFieldKey, string> = {
  contact_name_first: 'First Name',
  contact_name_last: 'Last Name',
  company_name: 'Company',
  contact_email: 'Email',
  discovery_source: 'How did you hear about us?',
  campaign_title: 'Campaign Title',
  campaign_type: 'What type of project is this?',
  brand_description: 'Brand Info',
  product_description: 'Product Details',
  campaign_description: 'Campaign Goals & Style',
  target_audience: 'Target Audience',
  reference_videos: 'Reference Videos',
  delivery_deadline: 'Delivery Deadline',
  delivery_deadline_unknown: "I'm not sure yet",
  delivery_deadline_note: 'Rough timeframe (optional)',
  extra_deliverables: 'Extra Deliverables',
  extra_deliverables_other_note: 'Tell us more',
  budget_range: 'Budget Range',
  project_description: 'Project Description',
  shoot_event_date: 'Shoot / Event Date',
  shoot_event_date_unknown: "I'm not sure yet",
  shoot_event_date_note: 'Rough timeframe (optional)',
  production_scope: 'What do you need from us?',
  social_channels: 'Platforms',
  aspect_ratios: 'Aspect Ratios',
  additional_notes: 'Anything else we should know?',
};

/** Step metadata for the multi-step form shell. */
export interface CampaignBriefStepConfig {
  step: number;
  title: string;
  fields: CampaignBriefFieldKey[];
}

export const CAMPAIGN_BRIEF_STEPS: CampaignBriefStepConfig[] = [
  {
    step: 1,
    title: 'Contact',
    fields: [
      'contact_name_first',
      'contact_name_last',
      'company_name',
      'contact_email',
      'discovery_source',
    ],
  },
  {
    step: 2,
    title: 'Campaign Details',
    fields: [
      'campaign_title',
      'campaign_type',
      'brand_description',
      'product_description',
      'campaign_description',
      'target_audience',
      'reference_videos',
      'delivery_deadline',
      'extra_deliverables',
      'budget_range',
      'project_description',
      'shoot_event_date',
      'production_scope',
      'social_channels',
      'aspect_ratios',
    ],
  },
  {
    step: 3,
    title: 'Final Notes',
    fields: ['additional_notes'],
  },
];

/** Required on step navigation and final submit. */
export const CAMPAIGN_BRIEF_REQUIRED_FIELDS: CampaignBriefFieldKey[] = [
  'campaign_title',
  'company_name',
  'contact_name_first',
  'contact_name_last',
  'contact_email',
  'campaign_type',
  'budget_range',
];

export const CAMPAIGN_BRIEF_FORM_DESCRIPTION =
  'This briefing form helps us understand your brand, product, and upcoming video campaign. The more you can provide, the more effectively we can shape the creative direction and production approach. If you\'re unsure about anything, feel free to leave them blank — our team will guide you through next steps.';

export const CAMPAIGN_BRIEF_SUCCESS_MESSAGE =
  "Thanks for your brief — we'll be in touch shortly.";

export const CAMPAIGN_TYPE_OPTIONS = [
  'Product Campaign',
  'Branding Campaign',
  'Documentary / Live Event',
  'Social Media',
  'Other',
] as const;

export type CampaignTypeOption = (typeof CAMPAIGN_TYPE_OPTIONS)[number];

export const DISCOVERY_SOURCE_OPTIONS = [
  'Search engine',
  'Facebook / Instagram',
  'YouTube / Vimeo',
  'Xinpianchang / rednote',
  'Referral from a colleague',
] as const;

export const BUDGET_OPTIONS_PRODUCT_BRANDING = [
  'Under $75K',
  '$75K–$100K',
  '$100K–$150K',
  '$150K–$250K',
  '$250K+',
] as const;

export const BUDGET_OPTIONS_DOC_SOCIAL = [
  'Under $15K',
  '$15K–$30K',
  '$30K–$50K',
  '$50K–$100K',
  '$100K+',
] as const;

export const BUDGET_OPTIONS_OTHER = [
  'Under $20K',
  '$20K–$50K',
  '$50K–$100K',
  '$100K–$200K',
  '$200K+',
] as const;

/** Dynamic budget options for the selected campaign type. */
export function budgetOptionsForCampaignType(
  campaignType: string,
): readonly string[] {
  if (campaignType === 'Product Campaign' || campaignType === 'Branding Campaign') {
    return BUDGET_OPTIONS_PRODUCT_BRANDING;
  }
  if (campaignType === 'Documentary / Live Event' || campaignType === 'Social Media') {
    return BUDGET_OPTIONS_DOC_SOCIAL;
  }
  if (campaignType === 'Other') {
    return BUDGET_OPTIONS_OTHER;
  }
  return [];
}

export const EXTRA_DELIVERABLES_OPTIONS = [
  'Social cutdowns',
  'Still photos',
  'Other',
] as const;

export const PRODUCTION_SCOPE_OPTIONS = [
  'Filming only',
  'Filming + post-production',
] as const;

export const SOCIAL_CHANNEL_OPTIONS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Facebook',
  'LinkedIn',
  'Xiaohongshu / rednote',
] as const;

export const ASPECT_RATIO_OPTIONS = [
  '9:16 (Vertical)',
  '1:1 (Square)',
  '16:9 (Horizontal)',
  '4:5 (Portrait)',
] as const;

/** Branch-relevant field keys for the team notification email. */
export function emailFieldsForCampaignType(
  campaignType: string,
): CampaignBriefFieldKey[] {
  const shared: CampaignBriefFieldKey[] = ['campaign_title', 'campaign_type'];

  switch (campaignType) {
    case 'Product Campaign':
      return [
        ...shared,
        'brand_description',
        'product_description',
        'campaign_description',
        'target_audience',
        'reference_videos',
        'delivery_deadline',
        'extra_deliverables',
        'extra_deliverables_other_note',
        'budget_range',
      ];
    case 'Branding Campaign':
      return [
        ...shared,
        'brand_description',
        'campaign_description',
        'target_audience',
        'reference_videos',
        'delivery_deadline',
        'extra_deliverables',
        'extra_deliverables_other_note',
        'budget_range',
      ];
    case 'Documentary / Live Event':
      return [
        ...shared,
        'project_description',
        'reference_videos',
        'shoot_event_date',
        'production_scope',
        'delivery_deadline',
        'budget_range',
      ];
    case 'Social Media':
      return [
        ...shared,
        'brand_description',
        'campaign_description',
        'target_audience',
        'social_channels',
        'aspect_ratios',
        'delivery_deadline',
        'budget_range',
      ];
    case 'Other':
      return [
        ...shared,
        'project_description',
        'reference_videos',
        'delivery_deadline',
        'budget_range',
      ];
    default:
      return [...shared, 'budget_range'];
  }
}

export const CAMPAIGN_BRIEF_MAX_FILES = 10;

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
