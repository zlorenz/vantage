/**
 * Replace Home page body/bodyZh with the clean company-description paragraphs
 * (formerly hardcoded in src/lib/home-content.ts).
 *
 * Usage: npx tsx scripts/migration/patch/seed-home-body-from-home-content.ts
 */

import {pageId} from '../lib/ids'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const HOME_ABOUT_EN = [
  'Vantage Pictures is a globally operating commercial film production company creating cinematic brand films, product launch campaigns, and high-impact technology commercials for ambitious companies worldwide. We collaborate with fast-growing innovators and established global brands to craft visually refined, strategically grounded films that elevate product storytelling and brand identity.',
  'A core specialty of our studio is helping Asian technology brands — particularly from China — connect with Western audiences through premium, internationally positioned campaigns. From robotics and AI to consumer electronics and next-generation hardware, we translate complex innovation into emotionally resonant visual storytelling.',
  'Beyond technology, our portfolio spans lifestyle, automotive, energy, sport, and documentary-driven brand films — all executed with disciplined production standards, cinematic craft, and cross-border expertise.',
]

const HOME_ABOUT_ZH = [
  'Vantage Pictures 是一家全球性商业电影制作公司，为世界各地雄心勃勃的企业打造电影级品牌影片、产品发布宣传片和高科技商业广告。我们与快速成长的创新企业和成熟全球品牌合作，制作视觉精致、战略扎实的影片，提升产品叙事与品牌形象。',
  '我们的核心专长是帮助亚洲科技企业——尤其是来自中国的品牌——通过高端、国际化的宣传活动与西方受众建立联系。从机器人与人工智能到消费电子和下一代硬件，我们将复杂的创新转化为富有感染力的视觉叙事。',
  '除科技领域外，我们的作品集还涵盖生活方式、汽车、能源、体育和纪录片风格的品牌影片——均以严谨的制作标准、电影级工艺和跨境经验完成。',
]

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

function paragraphsToBlocks(paragraphs: string[]) {
  return paragraphs.map((text) => {
    const blockKey = newKey()
    const spanKey = newKey()
    return {
      _type: 'block' as const,
      _key: blockKey,
      style: 'normal' as const,
      markDefs: [] as unknown[],
      children: [
        {
          _type: 'span' as const,
          _key: spanKey,
          text,
          marks: [] as string[],
        },
      ],
    }
  })
}

async function main() {
  const client = getWriteClient()
  const homeId = pageId('home')
  const body = paragraphsToBlocks(HOME_ABOUT_EN)
  const bodyZh = paragraphsToBlocks(HOME_ABOUT_ZH)

  await client.patch(homeId).set({body, bodyZh}).commit()
  console.log(
    `Set Home body (${body.length} EN / ${bodyZh.length} ZH paragraphs) on ${homeId}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
