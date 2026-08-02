/**
 * Slug helpers for LocalePair slug Generate buttons.
 * EN mirrors Sanity’s default speakingurl-style ASCII slug; ZH keeps CJK.
 */

export function slugifyEn(value: string, maxLength = 96): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (slug.length <= maxLength) return slug
  return slug.slice(0, maxLength).replace(/-+$/g, '')
}

export function slugifyZh(value: string, maxLength = 96): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[""„‟«»']/g, '')
    .replace(/[^\w\u4e00-\u9fff：:.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (slug.length <= maxLength) return slug
  return slug.slice(0, maxLength).replace(/-+$/g, '')
}
