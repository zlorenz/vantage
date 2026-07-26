/**
 * Locale copy for the Campaign Brief form (Phase B ZH).
 * Option `value`s stay English (API / email / visibility logic); only labels translate.
 */

import {
  BUDGET_RANGE_OPTIONS,
  CAMPAIGN_BRIEF_FIELD_LABELS,
  CAMPAIGN_BRIEF_FORM_DESCRIPTION,
  CAMPAIGN_BRIEF_MAX_FILES,
  CAMPAIGN_BRIEF_STEPS,
  CAMPAIGN_BRIEF_SUCCESS_MESSAGE,
  CAMPAIGN_FOCUS_OPTIONS,
  DELIVERABLES_OPTIONS,
  DELIVERY_FLEXIBILITY_OPTIONS,
  DISCOVERY_SOURCE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
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
  nameLabel: string;
  firstSublabel: string;
  lastSublabel: string;
  briefingMaterials: string;
  attachFiles: string;
  removeFile: string;
  acceptedFilesHelp: string;
  maxFilesAllowed: (max: number) => string;
  fileTypeNotAllowed: (filename: string) => string;
  fieldLabels: Record<CampaignBriefFieldKey, string>;
  hints: Partial<Record<CampaignBriefFieldKey, string>>;
  steps: CampaignBriefStepConfig[];
  sections: {
    productDetails: string;
    cutdowns: string;
    social: string;
    stills: string;
  };
  projectTypes: CampaignBriefLabeledOption[];
  discoverySources: CampaignBriefLabeledOption[];
  budgetRanges: CampaignBriefLabeledOption[];
  deliveryFlexibility: CampaignBriefLabeledOption[];
  campaignFocus: CampaignBriefLabeledOption[];
  deliverables: CampaignBriefLabeledOption[];
};

const FIELD_LABELS_ZH: Record<CampaignBriefFieldKey, string> = {
  project_title: '项目名称',
  company_name: '公司名称',
  project_type: '这是什么类型的项目？',
  discovery_source: '您是如何知道我们的？',
  referral_source_other: '请告诉我们您是如何找到我们的',
  referrer_name: '谁介绍的？',
  contact_name_first: '名',
  contact_name_last: '姓',
  contact_job_title: '职位名称',
  contact_email: '电子邮件',
  contact_phone: '电话',
  campaign_goals: '视频活动的主要目标',
  key_message: '您想向观众传达的关键信息是什么？',
  target_audience: '目标受众',
  desired_runtime: '希望的时长',
  video_tone_style: '描述您所设想的情绪和风格。您希望观众感受到什么情绪？',
  reference_videos: '如果您看过能引起您共鸣的广告，我们很乐意看到。请在此处粘贴视频链接',
  campaign_keywords_or_avoidances: '有什么主题、流行语或口号需要我们强调吗？有什么需要避免的？',
  budget_range: '您的预算范围是多少？',
  distribution_channels: '如何发布和展示这段视频？',
  target_regions: '您的目标是哪些国家或地区？',
  usage_rights_term: '您计划在该视频上投放多长时间的付费广告（如果有的话）？',
  delivery_deadline: '最后交付期限',
  delivery_flexibility: '这个期限是固定的还是灵活的？',
  launch_timing: '视频发布是否与任何活动、发布会或节日有关？',
  brand_description: '描述您的品牌以及您提供的产品/服务类型',
  brand_mission: '公司使命或核心价值观',
  campaign_focus: '该活动是否以特定产品或服务为重点？',
  product_name: '产品名称',
  product_key_features: '视频中要突出的关键卖点',
  market_pain_points: '您的产品克服了哪些市场痛点？',
  product_differentiators: '是什么让您的产品从众多竞争解决方案中脱颖而出？',
  deliverables: '您需要哪些交付成果？',
  cutdown_durations: '您需要多长的删减版本？',
  cutdown_distribution: '删减版本将用于何处？',
  social_channels: '您将使用哪些社交渠道？',
  social_aspect_ratios: '您需要哪些长宽比/尺寸？',
  social_platform_requirements: '还有其他特定平台要求吗？',
  stills_type: '需要什么样的剧照？',
  photography_requirements: '对摄影师有其他特殊要求吗？',
  stills_quantity: '您希望交付多少成果？',
  additional_notes: '还有什么要补充的吗？',
};

const HINTS_EN: Partial<Record<CampaignBriefFieldKey, string>> = {
  project_title: 'Example: Nike Air Max 2025 Launch Campaign',
  company_name: 'Example: Nike Vietnam',
  campaign_goals:
    'Example: To promote a new product, raise brand awareness, build hype for an upcoming event',
  key_message:
    'Example: Our new product offers the widest range of functionality on the market at an affordable price',
  target_audience: 'Example: Women, tech enthusiasts, enterprise B2B customers',
  desired_runtime: 'Example: 90-sec hero film, between 2–3 mins, no more than 120 secs',
  video_tone_style:
    'Example: Documentary-style footage with uplifting music, fast-paced editing with vivid colors, slower pacing with 3D animation to illustrate complex features',
  reference_videos: 'Example: https://youtu.be/db-TQcdxLcI https://vimeo.com/445153961',
  campaign_keywords_or_avoidances:
    "Example: Durability, cutting-edge tech, 'Customer Always Comes First'",
  distribution_channels:
    'Example: Broadcast TV, YouTube, website, storefront displays, trade shows, keynote presentation',
  target_regions: 'Example: Globally, US and Europe, Southeast Asia',
  usage_rights_term: 'Example: 2 years, in perpetuity',
  delivery_deadline: 'Example: First week of April, fixed deadline',
  launch_timing: 'Example: Product launch, charity event, Black Friday sale, Lunar New Year',
  brand_description:
    'Example: We offer the best pet care products that are 100% USDA organic and cruelty-free',
  brand_mission:
    'Example: Our goal is to reduce air pollution by developing alternative methods of transportation for dense metropolitan areas',
  product_name: 'Example: Air Max 2025',
  product_key_features: 'Example: Lightest shoe in the Nike lineup, available in 12 colorways',
  market_pain_points: 'Example: Existing running shoes are too heavy for competitive athletes',
  product_differentiators:
    'Example: The only shoe with full-length ZoomX foam and a carbon fibre plate',
  cutdown_durations: 'Example: 30s, 15s, 10s, 6s bumper ads',
  cutdown_distribution:
    'Example: YouTube ads, Instagram reels, paid social ads, website landing page',
  social_channels: 'Example: Instagram Reels, TikTok, YouTube Shorts, LinkedIn',
  social_aspect_ratios: 'Example: 16:9 (YouTube), 1:1 (Instagram), 9:16 (TikTok / Reels)',
  social_platform_requirements:
    "Example: Must meet YouTube's 4K HDR specs, Instagram safe zone compliance",
  photography_requirements:
    'Example: White background product shots + lifestyle images in an urban setting',
  stills_quantity: 'Example: 10–15 hero shots',
};

/** ZH hints — polished from live vantage.pictures/zh/视频活动简介 copy. */
const HINTS_ZH: Partial<Record<CampaignBriefFieldKey, string>> = {
  project_title: '例如：Nike Air Max 2025 发布活动',
  company_name: '例如：Nike Vietnam',
  campaign_goals: '例如：推广新产品、提高品牌知名度、为市场活动造势',
  key_message: '例如：我们的新产品功能最全面，同时价格亲民',
  target_audience: '例如：女性、技术爱好者、企业 B2B 客户',
  desired_runtime: '例如：90 秒的主打影片，2–3 分钟，或不超过 120 秒',
  video_tone_style:
    '例如：纪录片风格搭配振奋人心的音乐、快节奏剪辑与鲜明色彩，或以较缓节奏结合 3D 动画说明复杂功能',
  reference_videos: '例如：https://youtu.be/db-TQcdxLcI https://vimeo.com/445153961',
  campaign_keywords_or_avoidances: '例如：耐用性、尖端技术、“客户永远第一”',
  distribution_channels: '例如：广播电视、YouTube、网站、店面展示、贸易展览、主题演讲',
  target_regions: '例如：全球、美国和欧洲、东南亚',
  usage_rights_term: '这对计算人才使用权费用非常重要。',
  delivery_deadline: '例如：四月第一周，固定截止日期',
  launch_timing: '例如：产品发布、慈善活动、黑色星期五促销、农历新年……',
  brand_description: '例如：我们提供 100% USDA 有机、无虐待动物的优质宠物护理产品',
  brand_mission:
    '例如：我们的目标是为人口密集的大都市地区开发替代交通方式，从而减少空气污染',
  product_name: '如果您有一个内部保密代号，也没关系。',
  product_key_features: '例如：全新设计、5 个可定制选项、自动化功能、市场上最快的 CPU',
  market_pain_points:
    '例如：我们的客户生活繁忙，渴望品尝上好的咖啡。我们的网店提供最高品质、符合道德采购标准的咖啡豆，并可直接送货上门。',
  product_differentiators:
    '例如：虽然许多竞争对手主打最低价，但我们更注重设计和耐用性。我们的鞋子可能并不便宜，但它们看起来很出色，而且可以终身穿着。',
  cutdown_durations: '例如：30 秒、15 秒、10 秒、6 秒片头广告',
  cutdown_distribution: '例如：YouTube 广告、Instagram 短片、付费社交广告、网站着陆页',
  social_channels: '例如：Instagram Reels、TikTok、YouTube Shorts、LinkedIn',
  social_aspect_ratios: '例如：16:9（YouTube）、1:1（Instagram）、9:16（TikTok / Reels）',
  social_platform_requirements:
    '例如：需要 CN、JP、KO、RU 字幕翻译，特定地区版本，特定平台品牌规范',
  photography_requirements:
    '例如：仅在摄影棚拍摄产品、与艺人一起拍摄生活方式内容、拍摄员工肖像',
  stills_quantity: '例如：5–10 张主视觉照片，20 张生活方式照片',
  stills_type: '例如：3D 关键视觉效果、产品主镜头、生活方式摄影、幕后花絮',
};

const STEP_TITLES_ZH = [
  '基本信息',
  '联系方式',
  '活动目标',
  '时间表和发布',
  '品牌/产品',
  '交付成果',
  '最后说明',
] as const;

const OPTION_LABELS_ZH: Record<string, string> = {
  'Product video': '产品视频',
  'Commercial spot': '商业广告',
  'Brand film': '品牌影片',
  'Corporate video': '企业视频',
  'Social media campaign': '社交媒体活动',
  Other: '其他',
  Google: '谷歌搜索',
  'Vimeo / YouTube': 'Vimeo / YouTube',
  Instagram: 'Instagram',
  LinkedIn: 'LinkedIn',
  Facebook: 'Facebook',
  'Colleague referral': '同事推荐',
  'Agency referral': '机构转介',
  'Partner referral': '视频制作合作伙伴推荐',
  'Industry event': '广告会议或行业活动',
  'Previous client': '既往客户',
  'Under $80K': '低于 $80K 美元',
  '$80K–$150K': '$80K-$150K 美元',
  '$150K–$200K': '$150K-$200K 美元',
  '$200K–$250K': '$200K-$250K 美元',
  '$250K+ USD': '$250K+ 美元',
  Fixed: '固定',
  Flexible: '灵活',
  'Not sure yet': '尚不确定',
  Yes: '是',
  No: '否',
  'Main hero film': '主打影片',
  Cutdowns: '删减/简短版本',
  'Social versions': '社交版本/调整尺寸格式',
  'Key visuals': '主视觉/静态摄影',
  'Motion graphics': '动态图形',
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

const UI_EN: CampaignBriefUi = {
  formDescription: CAMPAIGN_BRIEF_FORM_DESCRIPTION,
  successMessage: CAMPAIGN_BRIEF_SUCCESS_MESSAGE,
  submitAnother: 'Submit another brief',
  stepCount: (current, total = 7) => `STEP ${current} OF ${total}`,
  previous: 'Previous',
  next: 'Next',
  submitBrief: 'Submit Brief',
  submitError:
    'Something went wrong. Please try again or email us at info@vantage.pictures',
  fieldRequired: 'This field is required.',
  invalidEmail: 'Please enter a valid email address.',
  selectPlaceholder: 'Select…',
  nameLabel: 'Name',
  firstSublabel: 'First',
  lastSublabel: 'Last',
  briefingMaterials: 'Briefing materials upload',
  attachFiles: 'Attach files',
  removeFile: 'Remove',
  acceptedFilesHelp: 'Accepted: pdf, ppt, pptx, key, doc, docx, pages, xls, xlsx, numbers, zip, jpg, jpeg, png. Max 10 files.',
  maxFilesAllowed: (max) => `Maximum ${max} files allowed.`,
  fileTypeNotAllowed: (filename) => `File type not allowed: ${filename}`,
  fieldLabels: CAMPAIGN_BRIEF_FIELD_LABELS,
  hints: HINTS_EN,
  steps: stepsForLocale('en'),
  sections: {
    productDetails: 'Product Details',
    cutdowns: 'Cutdowns',
    social: 'Social Versions',
    stills: 'Stills / Key Visuals',
  },
  projectTypes: labeled([...PROJECT_TYPE_OPTIONS], 'en'),
  discoverySources: labeled([...DISCOVERY_SOURCE_OPTIONS], 'en'),
  budgetRanges: labeled([...BUDGET_RANGE_OPTIONS], 'en'),
  deliveryFlexibility: labeled([...DELIVERY_FLEXIBILITY_OPTIONS], 'en'),
  campaignFocus: labeled([...CAMPAIGN_FOCUS_OPTIONS], 'en'),
  deliverables: labeled([...DELIVERABLES_OPTIONS], 'en'),
};

const FORM_DESCRIPTION_ZH =
  '这份简介表有助于我们了解您的品牌、产品和即将开展的视频活动。您提供的信息越多，我们就能越有效地确定创意方向和制作方法。如果您有任何不确定的地方，请留下空白——我们的团队将指导您完成下一步。';

const UI_ZH: CampaignBriefUi = {
  formDescription: FORM_DESCRIPTION_ZH,
  successMessage: '感谢您提交简介——我们会尽快与您联系。',
  submitAnother: '再提交一份简介',
  stepCount: (current, total = 7) => `第 ${current} 步，共 ${total} 步`,
  previous: '上一页',
  next: '下一页',
  submitBrief: '提交简介',
  submitError: '出错了。请重试，或发送邮件至 info@vantage.pictures',
  fieldRequired: '此字段为必填项。',
  invalidEmail: '请输入有效的电子邮件地址。',
  selectPlaceholder: '请选择…',
  nameLabel: '姓名',
  firstSublabel: '名',
  lastSublabel: '姓',
  briefingMaterials: '简报材料上传',
  attachFiles: '选择文件',
  removeFile: '移除',
  acceptedFilesHelp:
    '接受的文件类型：pdf, ppt, pptx, key, doc, docx, pages, xls, xlsx, numbers, zip, jpg, jpeg, png。最多 10 个文件。',
  maxFilesAllowed: (max) => `最多允许 ${max} 个文件。`,
  fileTypeNotAllowed: (filename) => `不支持的文件类型：${filename}`,
  fieldLabels: FIELD_LABELS_ZH,
  hints: HINTS_ZH,
  steps: stepsForLocale('zh'),
  sections: {
    productDetails: '产品详情',
    cutdowns: '删减/简短版本',
    social: '社交版本/调整尺寸',
    stills: '主视觉/静态摄影',
  },
  projectTypes: labeled([...PROJECT_TYPE_OPTIONS], 'zh'),
  discoverySources: labeled([...DISCOVERY_SOURCE_OPTIONS], 'zh'),
  budgetRanges: labeled([...BUDGET_RANGE_OPTIONS], 'zh'),
  deliveryFlexibility: labeled([...DELIVERY_FLEXIBILITY_OPTIONS], 'zh'),
  campaignFocus: labeled([...CAMPAIGN_FOCUS_OPTIONS], 'zh'),
  deliverables: labeled([...DELIVERABLES_OPTIONS], 'zh'),
};

export function getCampaignBriefUi(locale: Locale): CampaignBriefUi {
  return locale === 'zh' ? UI_ZH : UI_EN;
}

export type CampaignBriefPhrasePair = {
  en: string
  zh: string
  codePath: string
}

/**
 * Flatten Campaign Brief EN→ZH copy for the Translations phrase inventory (Interface).
 * Template strings use representative examples (step 1/7, max files, sample filename).
 */
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
  push(UI_EN.stepCount(1, 7), UI_ZH.stepCount(1, 7), 'stepCount')
  push(UI_EN.previous, UI_ZH.previous, 'previous')
  push(UI_EN.next, UI_ZH.next, 'next')
  push(UI_EN.submitBrief, UI_ZH.submitBrief, 'submitBrief')
  push(UI_EN.submitError, UI_ZH.submitError, 'submitError')
  push(UI_EN.fieldRequired, UI_ZH.fieldRequired, 'fieldRequired')
  push(UI_EN.invalidEmail, UI_ZH.invalidEmail, 'invalidEmail')
  push(UI_EN.selectPlaceholder, UI_ZH.selectPlaceholder, 'selectPlaceholder')
  push(UI_EN.nameLabel, UI_ZH.nameLabel, 'nameLabel')
  push(UI_EN.firstSublabel, UI_ZH.firstSublabel, 'firstSublabel')
  push(UI_EN.lastSublabel, UI_ZH.lastSublabel, 'lastSublabel')
  push(UI_EN.briefingMaterials, UI_ZH.briefingMaterials, 'briefingMaterials')
  push(UI_EN.attachFiles, UI_ZH.attachFiles, 'attachFiles')
  push(UI_EN.removeFile, UI_ZH.removeFile, 'removeFile')
  push(UI_EN.acceptedFilesHelp, UI_ZH.acceptedFilesHelp, 'acceptedFilesHelp')
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

  for (const key of Object.keys(UI_EN.fieldLabels) as CampaignBriefFieldKey[]) {
    push(UI_EN.fieldLabels[key], UI_ZH.fieldLabels[key], `fieldLabels.${key}`)
  }

  for (const key of Object.keys(HINTS_EN) as CampaignBriefFieldKey[]) {
    const en = HINTS_EN[key]
    const zh = HINTS_ZH[key] ?? ''
    if (en) push(en, zh, `hints.${key}`)
  }

  for (let i = 0; i < UI_EN.steps.length; i++) {
    const enStep = UI_EN.steps[i]!
    const zhStep = UI_ZH.steps[i]!
    push(enStep.title, zhStep.title, `steps[${i}].title`)
  }

  for (const key of Object.keys(UI_EN.sections) as Array<
    keyof CampaignBriefUi['sections']
  >) {
    push(UI_EN.sections[key], UI_ZH.sections[key], `sections.${key}`)
  }

  const optionGroups: Array<{
    path: string
    en: CampaignBriefLabeledOption[]
    zh: CampaignBriefLabeledOption[]
  }> = [
    {path: 'projectTypes', en: UI_EN.projectTypes, zh: UI_ZH.projectTypes},
    {
      path: 'discoverySources',
      en: UI_EN.discoverySources,
      zh: UI_ZH.discoverySources,
    },
    {path: 'budgetRanges', en: UI_EN.budgetRanges, zh: UI_ZH.budgetRanges},
    {
      path: 'deliveryFlexibility',
      en: UI_EN.deliveryFlexibility,
      zh: UI_ZH.deliveryFlexibility,
    },
    {path: 'campaignFocus', en: UI_EN.campaignFocus, zh: UI_ZH.campaignFocus},
    {path: 'deliverables', en: UI_EN.deliverables, zh: UI_ZH.deliverables},
  ]

  for (const group of optionGroups) {
    group.en.forEach((opt, index) => {
      const zhOpt = group.zh[index]
      push(opt.label, zhOpt?.label ?? '', `${group.path}[${index}]`)
    })
  }

  return out
}
