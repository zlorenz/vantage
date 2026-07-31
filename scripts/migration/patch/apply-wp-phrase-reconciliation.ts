/**
 * One-shot: apply WP phrase-book reconciliation decisions.
 *   - 11 zh updates
 *   - 2 deletions (Post / Loader homonyms)
 * Does not touch EP / PA / Mammotion YUKA Mini 2.
 */
import path from 'node:path'
import {config as loadEnv} from 'dotenv'
import {createClient} from '@sanity/client'

loadEnv({path: path.resolve(process.cwd(), '.env.local')})

const token =
  process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN || ''
if (!token) {
  throw new Error('Missing SANITY_API_WRITE_TOKEN / SANITY_API_TOKEN')
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '7oesp86l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const UPDATES: Array<{id: string; zh: string}> = [
  {id: 'phrase.behind-the-scenes.1655fc8b', zh: '幕后'},
  {id: 'phrase.govee.ff4d53b9', zh: '格维'},
  {id: 'phrase.home.52f50eae', zh: '首页'},
  {id: 'phrase.iceco-go20.039256c6', zh: 'ICECO Go20'},
  {id: 'phrase.link.8e08e589', zh: '链接'},
  {id: 'phrase.online.bc3b88aa', zh: '在线'},
  {id: 'phrase.online-editor.de8750ff', zh: '在线编辑'},
  {id: 'phrase.reno10-pro-5g.b74f2b3e', zh: 'Reno10 Pro+ 5G'},
  {id: 'phrase.stunt-driver.2ddf5567', zh: '特技司机'},
  {id: 'phrase.video-campaign-brief.524d6cda', zh: '视频活动简介'},
  {id: 'phrase.vietnam-production-service.1b5c8779', zh: '越南生产服务'},
]

const DELETES = ['phrase.post.f0c79167', 'phrase.loader.6249c9c2']
const LEAVE = [
  'phrase.ep.22cc1770',
  'phrase.pa.3000074a',
  'phrase.mammotion-yuka-mini-2.67ec19a7',
]

async function main() {
  const leaveBefore = await client.fetch(`*[_id in $ids]{_id, en, zh}`, {
    ids: LEAVE,
  })
  console.log('LEAVE_AS_IS before:', JSON.stringify(leaveBefore, null, 2))

  const before = await client.fetch(`*[_id in $ids]{_id, en, zh}`, {
    ids: UPDATES.map((u) => u.id),
  })
  console.log('BEFORE_UPDATES:', JSON.stringify(before, null, 2))

  const toDelete = await client.fetch(`*[_id in $ids]{_id, en, zh}`, {
    ids: DELETES,
  })
  console.log('BEFORE_DELETES:', JSON.stringify(toDelete, null, 2))

  const tx = client.transaction()
  for (const u of UPDATES) {
    tx.patch(u.id, (p) => p.set({zh: u.zh}))
  }
  for (const id of DELETES) {
    tx.delete(id)
    tx.delete(`drafts.${id}`)
  }
  const result = await tx.commit({visibility: 'sync'})
  console.log('transactionId:', result.transactionId)

  const after = await client.fetch(`*[_id in $ids]{_id, en, zh}`, {
    ids: UPDATES.map((u) => u.id),
  })
  console.log('AFTER_UPDATES:', JSON.stringify(after, null, 2))

  const stillThere = await client.fetch(
    `*[_id in $ids || _id in $draftIds]{_id, en, zh}`,
    {ids: DELETES, draftIds: DELETES.map((id) => `drafts.${id}`)},
  )
  console.log('DELETED_STILL_PRESENT:', JSON.stringify(stillThere))

  const leaveAfter = await client.fetch(`*[_id in $ids]{_id, en, zh}`, {
    ids: LEAVE,
  })
  console.log('LEAVE_AS_IS after:', JSON.stringify(leaveAfter, null, 2))

  const mismatches: Array<Record<string, string>> = []
  for (const u of UPDATES) {
    const row = after.find((r: {_id: string; zh?: string}) => r._id === u.id)
    if (!row) mismatches.push({id: u.id, error: 'missing'})
    else if (row.zh !== u.zh)
      mismatches.push({id: u.id, expected: u.zh, got: String(row.zh)})
  }
  console.log(
    JSON.stringify(
      {
        updates_ok: mismatches.length === 0 && after.length === 11,
        deletes_ok: stillThere.length === 0,
        mismatches,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
