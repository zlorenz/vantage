/**
 * Phase A helper: POST a signed Sanity-shaped payload to the revalidate route.
 *
 * Usage:
 *   SANITY_REVALIDATE_SECRET=local-test-secret \
 *   REVALIDATE_URL=http://localhost:3001/api/webhooks/sanity-revalidate \
 *   npx tsx scripts/test-sanity-revalidate.ts portfolio
 *
 * Types: portfolio | blog | page | page-home | bad-sig | no-type
 */

import {encodeSignatureHeader, SIGNATURE_HEADER_NAME} from '@sanity/webhook'

const secret = process.env.SANITY_REVALIDATE_SECRET
const url =
  process.env.REVALIDATE_URL ||
  'http://localhost:3000/api/webhooks/sanity-revalidate'

if (!secret) {
  console.error('Set SANITY_REVALIDATE_SECRET to the same value the server uses.')
  process.exit(1)
}

const kind = process.argv[2] || 'portfolio'

const payloads: Record<string, Record<string, unknown>> = {
  portfolio: {
    _id: 'portfolio-aeb7a22613',
    _type: 'portfolioEntry',
    slug: 'macbook-neo',
    slugZh: 'macbook-neo',
  },
  blog: {
    _id: 'post-example',
    _type: 'blogPost',
    slug: 'hello-world',
    slugZh: '你好世界',
  },
  page: {
    _id: 'page-work',
    _type: 'page',
    slug: 'work',
    slugZh: '工作',
  },
  'page-home': {
    _id: 'page-home',
    _type: 'page',
    slug: 'home',
  },
  'no-type': {
    _id: 'x',
    slug: 'nope',
  },
}

async function main() {
  const bodyObj =
    kind === 'bad-sig'
      ? payloads.portfolio
      : payloads[kind] || payloads.portfolio
  const body = JSON.stringify(bodyObj)
  const signature =
    kind === 'bad-sig'
      ? await encodeSignatureHeader(body, Date.now(), 'wrong-secret')
      : await encodeSignatureHeader(body, Date.now(), secret!)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [SIGNATURE_HEADER_NAME]: signature,
    },
    body,
  })
  const text = await res.text()
  console.log('status', res.status)
  console.log(text)
  process.exit(res.ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
