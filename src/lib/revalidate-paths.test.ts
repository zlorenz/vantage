/**
 * Unit checks for webhook → internal revalidatePath destinations.
 * Run: npx tsx src/lib/revalidate-paths.test.ts
 */

import assert from 'node:assert/strict'
import {pathsForWebhookBody} from './revalidate-paths'

const portfolio = pathsForWebhookBody({
  _type: 'portfolioEntry',
  _id: 'portfolio-1',
  slug: 'macbook-neo',
  slugZh: 'macbook-neo-zh',
})
assert.deepEqual(
  portfolio.sort(),
  [
    '/en',
    '/en/portfolio/macbook-neo',
    '/en/work',
    '/sitemap.xml',
    '/zh',
    '/zh/portfolio/macbook-neo-zh',
    '/zh/work',
  ].sort(),
)

const blog = pathsForWebhookBody({
  _type: 'blogPost',
  slug: 'hello-world',
  slugZh: '你好世界',
})
assert.ok(blog.includes('/en/hello-world'))
assert.ok(blog.includes('/zh/你好世界'))
assert.ok(blog.includes('/en/news'))
assert.ok(blog.includes('/zh/news'))
assert.ok(blog.includes('/en'))
assert.ok(blog.includes('/sitemap.xml'))

const workPage = pathsForWebhookBody({_type: 'page', slug: 'work'})
assert.deepEqual(workPage.sort(), ['/en/work', '/sitemap.xml', '/zh/work'].sort())

const homePage = pathsForWebhookBody({_type: 'page', slug: 'home'})
assert.deepEqual(homePage.sort(), ['/en', '/sitemap.xml', '/zh'].sort())

const unmapped = pathsForWebhookBody({
  _type: 'page',
  slug: 'custom-page',
  slugZh: '自定义',
})
assert.ok(unmapped.includes('/en/custom-page'))
assert.ok(unmapped.includes('/zh/自定义'))

console.log('revalidate-paths.test.ts: ok')
