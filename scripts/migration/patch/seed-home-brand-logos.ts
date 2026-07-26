/**
 * Seed page-home.brandLogos from HOME_BRAND_LOGO_IDS (live site order).
 *
 * Usage: npx tsx scripts/migration/patch/seed-home-brand-logos.ts
 */

import {HOME_BRAND_LOGO_IDS} from '../../../shared/client-logos'
import {pageId} from '../lib/ids'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

async function main() {
  const client = getWriteClient()
  const homeId = pageId('home')

  const brandLogos = HOME_BRAND_LOGO_IDS.map((logoId) => ({
    _type: 'brandLogoItem' as const,
    _key: newKey(),
    logoId,
  }))

  await client.patch(homeId).set({brandLogos}).commit()
  console.log(
    `Set brandLogos on ${homeId} (${brandLogos.length} logos):`,
    HOME_BRAND_LOGO_IDS.join(', '),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
