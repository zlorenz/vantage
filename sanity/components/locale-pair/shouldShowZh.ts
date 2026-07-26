/** True when English or Chinese has non-whitespace content. */
export function shouldShowZh(en: unknown, zh: unknown): boolean {
  return hasLocaleText(en) || hasLocaleText(zh)
}

/** Non-empty string, slug.current, or non-empty portable-text-like array. */
export function hasLocaleText(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'object' && value !== null && 'current' in value) {
    const current = (value as {current?: unknown}).current
    return typeof current === 'string' && current.trim().length > 0
  }
  if (Array.isArray(value)) return value.length > 0
  return false
}
