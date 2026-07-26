/**
 * Seed siteSettings.campaignCta from the former hardcoded STANDARD_CTA copy.
 *
 * Usage: npx tsx scripts/migration/patch/seed-campaign-cta.ts
 */

import {SITE_SETTINGS_ID} from '../lib/ids'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const CAMPAIGN_CTA = {
  _type: 'campaignCta' as const,
  heading:
    '<span class="vp-outline">LET\'S BRING</span> <strong>YOUR VISION</strong> <span class="vp-outline">TO LIFE!</span>',
  headingZh: '让我们一起把创意变成影像',
  paragraphs: [
    'Got a commercial, branded video or product campaign in mind? Every great idea starts with a clear vision.',
    'Start the conversation by filling out our client briefing form, which helps us gather all the details we need to build an accurate quote and production plan tailored to your next project!',
  ],
  paragraphsZh: [
    '有广告或品牌影片项目的想法吗？好的创意始于清晰的方向。',
    '请填写我们的项目简报表，开启合作沟通。这将帮助我们收集必要信息，为您的下一个项目制定准确的报价与制作计划。',
  ],
  buttonLabel: 'TELL US ABOUT YOUR CAMPAIGN',
  buttonLabelZh: '提交您的项目需求',
  buttonHref: '/video-campaign-brief',
}

async function main() {
  const client = getWriteClient()
  await client.patch(SITE_SETTINGS_ID).set({campaignCta: CAMPAIGN_CTA}).commit()
  console.log(`Set campaignCta on ${SITE_SETTINGS_ID}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
