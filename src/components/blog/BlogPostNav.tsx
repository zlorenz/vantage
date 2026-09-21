/**
 * BlogPostNav — end-of-post chronological next carousel.
 */

import type {Locale} from '@/i18n/routing'
import {loadBlogPostNavData} from '@/lib/blog-nav.server'
import {getPhraseRecord} from '@/lib/phrase-book'
import {BlogPostNavClient} from './BlogPostNavClient'

type BlogPostNavProps = {
  currentId: string
  locale: Locale
  readMore: string
}

export async function BlogPostNav({
  currentId,
  locale,
  readMore,
}: BlogPostNavProps) {
  const [data, phrases] = await Promise.all([
    loadBlogPostNavData(currentId),
    getPhraseRecord(),
  ])
  if (!data) return null

  return (
    <BlogPostNavClient
      locale={locale}
      phrases={phrases}
      slides={data.slides}
      readMore={readMore}
      catalogLength={data.catalogLength}
    />
  )
}
