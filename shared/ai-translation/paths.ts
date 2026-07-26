/** Path get helpers for Sanity document values (Translations dashboard). */

export function getAtPath(doc: unknown, path: string): unknown {
  if (!path || doc == null) return undefined
  const parts = path.split('.')
  let cur: unknown = doc
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

export function isEmptyZh(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return !value.trim()
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object' && value !== null && 'current' in value) {
    const current = (value as {current?: string}).current
    return !current?.trim()
  }
  return false
}

export function asPlainString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'current' in value) {
    return String((value as {current?: string}).current ?? '')
  }
  if (Array.isArray(value)) {
    return portableTextToPlain(value)
  }
  return String(value)
}

function portableTextToPlain(blocks: unknown[]): string {
  const parts: string[] = []
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const b = block as {_type?: string; children?: Array<{text?: string}>}
    if (b._type === 'block' && Array.isArray(b.children)) {
      parts.push(b.children.map((c) => c.text ?? '').join(''))
    }
  }
  return parts.join('\n').trim()
}
