/**
 * Parse legacy WordPress / ACF HTML credit strings into structured people.
 */

import type {CrewPersonValue} from './types'

const anchorRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/i
const attrRe = /([a-z-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi

function parseAnchorAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  let match: RegExpExecArray | null
  const re = new RegExp(attrRe.source, attrRe.flags)
  while ((match = re.exec(raw)) !== null) {
    attrs[match[1].toLowerCase()] = (match[3] ?? match[4] ?? '').trim()
  }
  return attrs
}

/** Normalize href values from WordPress (relative paths, localhost dev URLs). */
export function normalizeCreditUrl(href: string): string | undefined {
  const trimmed = href.trim()
  if (!trimmed) return undefined

  const fixed = trimmed
    .replaceAll('http://localhost:8888/vantage-local/', 'https://vantage.pictures/')
    .replaceAll('https://localhost:8888/vantage-local/', 'https://vantage.pictures/')

  if (/^https?:\/\//i.test(fixed)) return fixed
  if (fixed === '/' || fixed.startsWith('/')) {
    return `https://vantage.pictures${fixed === '/' ? '/' : fixed}`
  }
  return undefined
}

export interface ParsedLegacyPerson {
  name: string
  url?: string
  /** Anchor title attribute — used when different from visible name. */
  linkTitle?: string
}

function linkTitleFromAnchor(label: string, title?: string): string | undefined {
  if (!title?.trim()) return undefined
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
  return norm(title) !== norm(label) ? title.trim() : undefined
}

/** Parse one credit segment (plain text or a single anchor). */
export function parseLegacyCreditSegment(segment: string): ParsedLegacyPerson | null {
  const trimmed = segment.trim()
  if (!trimmed) return null

  const anchor = trimmed.match(anchorRe)
  if (anchor) {
    const attrs = parseAnchorAttrs(anchor[1])
    const label = anchor[2].replace(/<[^>]+>/g, '').trim()
    if (!label) return null
    const url = attrs.href ? normalizeCreditUrl(attrs.href) : undefined
    return {
      name: label,
      ...(url ? {url} : {}),
      ...(linkTitleFromAnchor(label, attrs.title) ? {linkTitle: attrs.title!.trim()} : {}),
    }
  }

  const name = trimmed.replace(/<[^>]+>/g, '').trim()
  return name ? {name} : null
}

/**
 * Split a legacy comma-separated credit string on commas outside HTML tags,
 * then parse each segment into structured people.
 */
export function parseLegacyNamesHtml(raw: string): CrewPersonValue[] {
  const input = raw.trim()
  if (!input) return []

  const segments: string[] = []
  let current = ''
  let depth = 0
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (char === '<') depth++
    if (char === '>') {
      depth = Math.max(0, depth - 1)
      current += char
      continue
    }
    if (char === ',' && depth === 0) {
      segments.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) segments.push(current)

  const people: CrewPersonValue[] = []
  for (const segment of segments) {
    const parsed = parseLegacyCreditSegment(segment)
    if (!parsed) continue
    people.push({
      _type: 'crewPerson',
      name: parsed.name,
      ...(parsed.url ? {url: parsed.url} : {}),
      ...(parsed.linkTitle ? {linkTitle: parsed.linkTitle} : {}),
    })
  }
  return people
}
