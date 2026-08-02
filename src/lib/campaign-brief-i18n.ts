/**
 * Locale copy for the Campaign Brief form.
 * Option `value`s stay English (API / email / visibility); only labels translate.
 */

import {
  ASPECT_RATIO_OPTIONS,
  BUDGET_OPTIONS_DOC_SOCIAL,
  BUDGET_OPTIONS_OTHER,
  BUDGET_OPTIONS_PRODUCT_BRANDING,
  CAMPAIGN_BRIEF_FIELD_LABELS,
  CAMPAIGN_BRIEF_FORM_DESCRIPTION,
  CAMPAIGN_BRIEF_MAX_FILES,
  CAMPAIGN_BRIEF_STEPS,
  CAMPAIGN_BRIEF_SUCCESS_MESSAGE,
  CAMPAIGN_TYPE_OPTIONS,
  DISCOVERY_SOURCE_OPTIONS,
  EXTRA_DELIVERABLES_OPTIONS,
  PRODUCTION_SCOPE_OPTIONS,
  SOCIAL_CHANNEL_OPTIONS,
  budgetOptionsForCampaignType,
  type CampaignBriefFieldKey,
  type CampaignBriefStepConfig,
} from './campaign-brief-fields'

type Locale = 'en' | 'zh'

export type CampaignBriefLabeledOption = {
  value: string;
  label: string;
};

export type CampaignBriefUi = {
  formDescription: string;
  successMessage: string;
  submitAnother: string;
  stepCount: (current: number, total?: number) => string;
  previous: string;
  next: string;
  submitBrief: string;
  submitError: string;
  fieldRequired: string;
  invalidEmail: string;
  selectPlaceholder: string;
  briefingMaterials: string;
  attachFiles: string;
  removeFile: string;
  acceptedFilesHelp: string;
  dropzonePrompt: string;
  dropzoneOr: string;
  maxFilesAllowed: (max: number) => string;
  fileTypeNotAllowed: (filename: string) => string;
  /** Shown when browser→Sanity upload fails before JSON submit. */
  fileUploadFailed: (filename: string) => string;
  fieldLabels: Record<CampaignBriefFieldKey, string>;
  /** Social Media branch uses a shortened campaign_description label. */
  campaignDescriptionSocialLabel: string;
  campaignDescriptionSocialHint: string;
  hints: Partial<Record<CampaignBriefFieldKey, string>>;
  steps: CampaignBriefStepConfig[];
  projectTypes: CampaignBriefLabeledOption[];
  discoverySources: CampaignBriefLabeledOption[];
  campaignTypes: CampaignBriefLabeledOption[];
  productionScopes: CampaignBriefLabeledOption[];
  extraDeliverables: CampaignBriefLabeledOption[];
  socialChannels: CampaignBriefLabeledOption[];
  aspectRatios: CampaignBriefLabeledOption[];
  budgetOptionsForType: (campaignType: string) => CampaignBriefLabeledOption[];
};

const FIELD_LABELS_ZH: Record<CampaignBriefFieldKey, string> = {
  contact_name_first: '名',
  contact_name_last: '姓',
  company_name: '公司名称',
  contact_email: '电子邮件',
  discovery_source: '您是如何知道我们的？',
  campaign_title: '项目名称',
  campaign_type: '这是什么类型的项目？',
  brand_description: '品牌介绍',
  product_description: '产品介绍',
  campaign_description: '宣传目标与风格',
  target_audience: '目标受众',
  reference_videos: '参考视频',
  delivery_deadline: '最后交付期限',
  delivery_deadline_unknown: '我还不确定',
  delivery_deadline_note: '大致时间（选填）',
  extra_deliverables: '附加交付内容',
  extra_deliverables_other_note: '请补充说明',
  budget_range: '预算范围',
  project_description: '项目描述',
  shoot_event_date: '拍摄/活动日期',
  shoot_event_date_unknown: '我还不确定',
  shoot_event_date_note: '大致时间（选填）',
  production_scope: '您需要我们提供哪些服务？',
  social_channels: '投放平台',
  aspect_ratios: '画面比例',
  additional_notes: '还有什么要补充的吗？',
};

const HINTS_EN: Partial<Record<CampaignBriefFieldKey, string>> = {
  campaign_title: "A working name for this project.",
  brand_description:
    "Tell us who you are — feel free to just share a website or social link if that's faster than writing it out.",
  product_description: 'What is it, and what makes it stand out from competitors?',
  campaign_description:
    "What are your main objectives? What's the tone and style you're imagining?",
  target_audience: 'Who is this video for?',
  reference_videos: 'Share links to any videos whose style or approach you like.',
  extra_deliverables: 'Do you need anything beyond the main video?',
  budget_range: 'Select the range that best fits your project.',
  project_description: "Tell us what this project is and what you're hoping to capture.",
  production_scope:
    "Just filming or do you also need us to edit the footage?",
  aspect_ratios: 'Which video formats do you need?',
  additional_notes:
    'Add any other details, links, or context that might help us understand the project.',
};

const HINTS_ZH: Partial<Record<CampaignBriefFieldKey, string>> = {
  campaign_title: '项目的临时名称即可，无需最终定稿。',
  brand_description:
    '简单介绍一下您的品牌——如果更方便，也可以直接提供官网或社交媒体链接。',
  product_description: '这是什么产品？它与竞品相比有什么亮点？',
  campaign_description:
    '您的主要目标是什么？您设想的基调和风格是怎样的？',
  target_audience: '谁是这支视频的目标观众？',
  reference_videos: '分享您喜欢的风格或呈现方式的参考视频链接。',
  extra_deliverables: '除了主视频之外，您还需要其他内容吗？',
  budget_range: '请选择最符合您项目预算的区间。',
  project_description: '请介绍一下这个项目，以及您希望呈现的内容。',
  production_scope: '只需要拍摄，还是也需要我们负责剪辑制作？',
  aspect_ratios: '您需要哪些视频画面比例？',
  additional_notes: '欢迎补充其他有助于我们了解项目的细节、链接或背景信息。',
};

/** Project-description note on the Other branch (EN differs from Documentary). */
const PROJECT_DESCRIPTION_OTHER_HINT_EN = 'Tell us what you have in mind.';
const PROJECT_DESCRIPTION_OTHER_HINT_ZH = '请告诉我们您的想法。';

const TARGET_AUDIENCE_SOCIAL_HINT_EN = 'Who is this content for?';
const TARGET_AUDIENCE_SOCIAL_HINT_ZH = '这些内容是给谁看的？';

const CAMPAIGN_DESCRIPTION_SOCIAL_LABEL_EN = 'Campaign Goals';
const CAMPAIGN_DESCRIPTION_SOCIAL_LABEL_ZH = '传播目标';
const CAMPAIGN_DESCRIPTION_SOCIAL_HINT_EN = "What are your main objectives? What's the tone and style you're imagining?";
const CAMPAIGN_DESCRIPTION_SOCIAL_HINT_ZH =
  '您的主要目标是什么？您设想的风格和调性是怎样的？';

const BRIEFING_MATERIALS_EN = 'Upload Files';
const BRIEFING_MATERIALS_ZH = '上传文件';
const BRIEFING_MATERIALS_HINT_EN =
  'Attach any brand guidelines, mood boards, or reference materials if you have them.';
const BRIEFING_MATERIALS_HINT_ZH =
  '如有品牌指南、灵感图或参考资料，欢迎一并上传。';
const DROPZONE_PROMPT_EN = 'Drag and drop files here';
const DROPZONE_PROMPT_ZH = '将文件拖拽到此处';
const DROPZONE_OR_EN = 'or';
const DROPZONE_OR_ZH = '或';

const STEP_TITLES_ZH = [
  '联系方式',
  '项目详情',
  '最后说明',
] as const;

const OPTION_LABELS_ZH: Record<string, string> = {
  'Search engine': '搜索引擎',
  'Facebook / Instagram': 'Facebook / Instagram',
  'YouTube / Vimeo': 'YouTube / Vimeo',
  'Xinpianchang / rednote': '新片场 / 小红书',
  'Referral from a colleague': '同事推荐',
  'Product Campaign': '产品宣传',
  'Branding Campaign': '品牌宣传',
  'Documentary / Live Event': '纪录片 / 现场活动',
  'Social Media': '社交媒体',
  Other: '其他',
  'Filming only': '仅拍摄',
  'Filming + post-production': '拍摄 + 后期制作',
  'Social cutdowns': '社交媒体剪辑版',
  'Still photos': '静态照片',
  Instagram: 'Instagram',
  TikTok: 'TikTok',
  YouTube: 'YouTube',
  Facebook: 'Facebook',
  LinkedIn: 'LinkedIn',
  'Xiaohongshu / rednote': '小红书',
  '9:16 (Vertical)': '9:16（竖屏）',
  '1:1 (Square)': '1:1（方形）',
  '16:9 (Horizontal)': '16:9（横屏）',
  '4:5 (Portrait)': '4:5（竖版）',
  'Under $75K': '50万以下',
  '$75K–$100K': '50万–70万',
  '$100K–$150K': '70万–100万',
  '$150K–$250K': '100万–170万',
  '$250K+': '170万以上',
  'Under $15K': '10万以下',
  '$15K–$30K': '10万–20万',
  '$30K–$50K': '20万–35万',
  '$50K–$100K': '35万–70万',
  '$100K+': '70万以上',
  'Under $20K': '15万以下',
  '$20K–$50K': '15万–35万',
  '$100K–$200K': '70万–140万',
  '$200K+': '140万以上',
};

function labeled(
  values: readonly string[],
  locale: Locale,
): CampaignBriefLabeledOption[] {
  return values.map((value) => ({
    value,
    label: locale === 'zh' ? (OPTION_LABELS_ZH[value] ?? value) : value,
  }));
}

function stepsForLocale(locale: Locale): CampaignBriefStepConfig[] {
  return CAMPAIGN_BRIEF_STEPS.map((step, index) => ({
    ...step,
    title: locale === 'zh' ? STEP_TITLES_ZH[index]! : step.title,
  }));
}

function budgetLabeled(locale: Locale) {
  return (campaignType: string): CampaignBriefLabeledOption[] =>
    labeled(budgetOptionsForCampaignType(campaignType), locale);
}

const FIELD_LABELS_EN: Record<CampaignBriefFieldKey, string> = {
  ...CAMPAIGN_BRIEF_FIELD_LABELS,
};

const UI_EN: CampaignBriefUi = {
  formDescription: CAMPAIGN_BRIEF_FORM_DESCRIPTION,
  successMessage: CAMPAIGN_BRIEF_SUCCESS_MESSAGE,
  submitAnother: 'Submit another brief',
  stepCount: (current, total = 3) => `STEP ${current} OF ${total}`,
  previous: 'Previous',
  next: 'Next',
  submitBrief: 'Submit Brief',
  submitError:
    'Something went wrong. Please try again or email us at info@vantage.pictures',
  fieldRequired: 'This field is required.',
  invalidEmail: 'Please enter a valid email address.',
  selectPlaceholder: 'Select…',
  briefingMaterials: BRIEFING_MATERIALS_EN,
  attachFiles: 'Browse files',
  removeFile: 'Remove',
  acceptedFilesHelp: BRIEFING_MATERIALS_HINT_EN,
  dropzonePrompt: DROPZONE_PROMPT_EN,
  dropzoneOr: DROPZONE_OR_EN,
  maxFilesAllowed: (max) => `Maximum ${max} files allowed.`,
  fileTypeNotAllowed: (filename) => `File type not allowed: ${filename}`,
  fileUploadFailed: (filename) =>
    `Couldn't upload ${filename} — please try again or remove it and continue without it.`,
  fieldLabels: FIELD_LABELS_EN,
  campaignDescriptionSocialLabel: CAMPAIGN_DESCRIPTION_SOCIAL_LABEL_EN,
  campaignDescriptionSocialHint: CAMPAIGN_DESCRIPTION_SOCIAL_HINT_EN,
  hints: HINTS_EN,
  steps: stepsForLocale('en'),
  projectTypes: [],
  discoverySources: labeled([...DISCOVERY_SOURCE_OPTIONS], 'en'),
  campaignTypes: labeled([...CAMPAIGN_TYPE_OPTIONS], 'en'),
  productionScopes: labeled([...PRODUCTION_SCOPE_OPTIONS], 'en'),
  extraDeliverables: labeled([...EXTRA_DELIVERABLES_OPTIONS], 'en'),
  socialChannels: labeled([...SOCIAL_CHANNEL_OPTIONS], 'en'),
  aspectRatios: labeled([...ASPECT_RATIO_OPTIONS], 'en'),
  budgetOptionsForType: budgetLabeled('en'),
};

const FORM_DESCRIPTION_ZH =
  '这份简介表有助于我们了解您的品牌、产品和即将开展的视频活动。您提供的信息越多，我们就能越有效地确定创意方向和制作方法。如果您有任何不确定的地方，请留下空白——我们的团队将指导您完成下一步。';

const UI_ZH: CampaignBriefUi = {
  formDescription: FORM_DESCRIPTION_ZH,
  successMessage: '感谢您提交简介——我们会尽快与您联系。',
  submitAnother: '再提交一份简介',
  stepCount: (current, total = 3) => `第 ${current} 步，共 ${total} 步`,
  previous: '上一页',
  next: '下一页',
  submitBrief: '提交简介',
  submitError: '出错了。请重试，或发送邮件至 info@vantage.pictures',
  fieldRequired: '此字段为必填项。',
  invalidEmail: '请输入有效的电子邮件地址。',
  selectPlaceholder: '请选择…',
  briefingMaterials: BRIEFING_MATERIALS_ZH,
  attachFiles: '浏览文件',
  removeFile: '移除',
  acceptedFilesHelp: BRIEFING_MATERIALS_HINT_ZH,
  dropzonePrompt: DROPZONE_PROMPT_ZH,
  dropzoneOr: DROPZONE_OR_ZH,
  maxFilesAllowed: (max) => `最多允许 ${max} 个文件。`,
  fileTypeNotAllowed: (filename) => `不支持的文件类型：${filename}`,
  fileUploadFailed: (filename) =>
    `无法上传 ${filename} — 请重试，或移除该文件后继续。`,
  fieldLabels: FIELD_LABELS_ZH,
  campaignDescriptionSocialLabel: CAMPAIGN_DESCRIPTION_SOCIAL_LABEL_ZH,
  campaignDescriptionSocialHint: CAMPAIGN_DESCRIPTION_SOCIAL_HINT_ZH,
  hints: HINTS_ZH,
  steps: stepsForLocale('zh'),
  projectTypes: [],
  discoverySources: labeled([...DISCOVERY_SOURCE_OPTIONS], 'zh'),
  campaignTypes: labeled([...CAMPAIGN_TYPE_OPTIONS], 'zh'),
  productionScopes: labeled([...PRODUCTION_SCOPE_OPTIONS], 'zh'),
  extraDeliverables: labeled([...EXTRA_DELIVERABLES_OPTIONS], 'zh'),
  socialChannels: labeled([...SOCIAL_CHANNEL_OPTIONS], 'zh'),
  aspectRatios: labeled([...ASPECT_RATIO_OPTIONS], 'zh'),
  budgetOptionsForType: budgetLabeled('zh'),
};

export function getCampaignBriefUi(locale: Locale): CampaignBriefUi {
  return locale === 'zh' ? UI_ZH : UI_EN;
}

/** Branch-specific hint overrides used by step components. */
export function getProjectDescriptionHint(locale: Locale, campaignType: string): string {
  if (campaignType === 'Other') {
    return locale === 'zh' ? PROJECT_DESCRIPTION_OTHER_HINT_ZH : PROJECT_DESCRIPTION_OTHER_HINT_EN;
  }
  const ui = getCampaignBriefUi(locale);
  return ui.hints.project_description ?? '';
}

export function getTargetAudienceHint(locale: Locale, campaignType: string): string {
  if (campaignType === 'Social Media') {
    return locale === 'zh' ? TARGET_AUDIENCE_SOCIAL_HINT_ZH : TARGET_AUDIENCE_SOCIAL_HINT_EN;
  }
  const ui = getCampaignBriefUi(locale);
  return ui.hints.target_audience ?? '';
}

export type CampaignBriefPhrasePair = {
  en: string
  zh: string
  codePath: string
}

export function listCampaignBriefPhrasePairs(): CampaignBriefPhrasePair[] {
  const out: CampaignBriefPhrasePair[] = []
  const seen = new Set<string>()
  const base = 'src/lib/campaign-brief-i18n.ts'

  const push = (enRaw: string, zhRaw: string, path: string) => {
    const en = enRaw.replace(/\s+/g, ' ').trim()
    const zh = zhRaw.replace(/\s+/g, ' ').trim()
    if (!en || seen.has(en)) return
    seen.add(en)
    out.push({en, zh, codePath: `${base} → ${path}`})
  }

  push(UI_EN.formDescription, UI_ZH.formDescription, 'formDescription')
  push(UI_EN.successMessage, UI_ZH.successMessage, 'successMessage')
  push(UI_EN.submitAnother, UI_ZH.submitAnother, 'submitAnother')
  push(UI_EN.stepCount(1, 3), UI_ZH.stepCount(1, 3), 'stepCount')
  push(UI_EN.previous, UI_ZH.previous, 'previous')
  push(UI_EN.next, UI_ZH.next, 'next')
  push(UI_EN.submitBrief, UI_ZH.submitBrief, 'submitBrief')
  push(UI_EN.submitError, UI_ZH.submitError, 'submitError')
  push(UI_EN.fieldRequired, UI_ZH.fieldRequired, 'fieldRequired')
  push(UI_EN.invalidEmail, UI_ZH.invalidEmail, 'invalidEmail')
  push(UI_EN.selectPlaceholder, UI_ZH.selectPlaceholder, 'selectPlaceholder')
  push(UI_EN.briefingMaterials, UI_ZH.briefingMaterials, 'briefingMaterials')
  push(UI_EN.attachFiles, UI_ZH.attachFiles, 'attachFiles')
  push(UI_EN.removeFile, UI_ZH.removeFile, 'removeFile')
  push(UI_EN.acceptedFilesHelp, UI_ZH.acceptedFilesHelp, 'acceptedFilesHelp')
  push(UI_EN.dropzonePrompt, UI_ZH.dropzonePrompt, 'dropzonePrompt')
  push(UI_EN.dropzoneOr, UI_ZH.dropzoneOr, 'dropzoneOr')
  push(
    UI_EN.campaignDescriptionSocialLabel,
    UI_ZH.campaignDescriptionSocialLabel,
    'campaignDescriptionSocialLabel',
  )
  push(
    UI_EN.campaignDescriptionSocialHint,
    UI_ZH.campaignDescriptionSocialHint,
    'campaignDescriptionSocialHint',
  )
  push(
    UI_EN.maxFilesAllowed(CAMPAIGN_BRIEF_MAX_FILES),
    UI_ZH.maxFilesAllowed(CAMPAIGN_BRIEF_MAX_FILES),
    'maxFilesAllowed',
  )
  push(
    UI_EN.fileTypeNotAllowed('example.pdf'),
    UI_ZH.fileTypeNotAllowed('example.pdf'),
    'fileTypeNotAllowed',
  )
  push(
    UI_EN.fileUploadFailed('example.pdf'),
    UI_ZH.fileUploadFailed('example.pdf'),
    'fileUploadFailed',
  )
  push(PROJECT_DESCRIPTION_OTHER_HINT_EN, PROJECT_DESCRIPTION_OTHER_HINT_ZH, 'projectDescriptionOtherHint')
  push(TARGET_AUDIENCE_SOCIAL_HINT_EN, TARGET_AUDIENCE_SOCIAL_HINT_ZH, 'targetAudienceSocialHint')

  for (const key of Object.keys(UI_EN.fieldLabels) as CampaignBriefFieldKey[]) {
    push(UI_EN.fieldLabels[key], UI_ZH.fieldLabels[key], `fieldLabels.${key}`)
  }

  for (const key of Object.keys(HINTS_EN) as CampaignBriefFieldKey[]) {
    const en = HINTS_EN[key]
    const zh = HINTS_ZH[key] ?? ''
    if (en) push(en, zh, `hints.${key}`)
  }

  for (let i = 0; i < UI_EN.steps.length; i++) {
    push(UI_EN.steps[i]!.title, UI_ZH.steps[i]!.title, `steps[${i}].title`)
  }

  const optionGroups: Array<{
    path: string
    en: CampaignBriefLabeledOption[]
    zh: CampaignBriefLabeledOption[]
  }> = [
    {path: 'discoverySources', en: UI_EN.discoverySources, zh: UI_ZH.discoverySources},
    {path: 'campaignTypes', en: UI_EN.campaignTypes, zh: UI_ZH.campaignTypes},
    {path: 'productionScopes', en: UI_EN.productionScopes, zh: UI_ZH.productionScopes},
    {path: 'extraDeliverables', en: UI_EN.extraDeliverables, zh: UI_ZH.extraDeliverables},
    {path: 'socialChannels', en: UI_EN.socialChannels, zh: UI_ZH.socialChannels},
    {path: 'aspectRatios', en: UI_EN.aspectRatios, zh: UI_ZH.aspectRatios},
    {
      path: 'budgetProductBranding',
      en: labeled([...BUDGET_OPTIONS_PRODUCT_BRANDING], 'en'),
      zh: labeled([...BUDGET_OPTIONS_PRODUCT_BRANDING], 'zh'),
    },
    {
      path: 'budgetDocSocial',
      en: labeled([...BUDGET_OPTIONS_DOC_SOCIAL], 'en'),
      zh: labeled([...BUDGET_OPTIONS_DOC_SOCIAL], 'zh'),
    },
    {
      path: 'budgetOther',
      en: labeled([...BUDGET_OPTIONS_OTHER], 'en'),
      zh: labeled([...BUDGET_OPTIONS_OTHER], 'zh'),
    },
  ]

  for (const group of optionGroups) {
    group.en.forEach((opt, index) => {
      const zhOpt = group.zh[index]
      push(opt.label, zhOpt?.label ?? '', `${group.path}[${index}]`)
    })
  }

  return out
}
