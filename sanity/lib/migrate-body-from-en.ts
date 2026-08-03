/**
 * Deep-clone an EN Portable Text (or any PT-like array) for ZH migrate.
 *
 * Regenerates every `_key` on array items (blocks, spans, markDefs, gallery
 * images, etc.) so Studio treats the ZH field as an independent array.
 * Key minting matches portable-text-media.ts / backfill-array-keys.ts.
 *
 * When a block has markDefs + children, span `marks` that referenced old
 * annotation keys are rewritten to the new markDef keys (links stay valid).
 *
 * Generic over member types (image / video / gallery / CTA) — no hardcoding.
 * Does not use or modify mergeChineseBodyWithEnglishMedia.
 */

type JsonObject = {[key: string]: unknown}

/** Same mint as src/lib/portable-text-media.ts `newKey()`. */
function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

function mintUniqueKey(used: Set<string>): string {
  let key = newKey()
  while (used.has(key)) key = newKey()
  used.add(key)
  return key
}

function cloneArrayItem(item: unknown, used: Set<string>): unknown {
  return cloneWithFreshKeys(item, used, true)
}

/**
 * Deep-clone `value`. Every object that sits in an array (or already had
 * `_key`) gets a fresh unique `_key` within this clone tree.
 */
function cloneWithFreshKeys(value: unknown, used: Set<string>, asArrayItem: boolean): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneArrayItem(item, used))
  }

  if (value !== null && typeof value === 'object') {
    const src = value as JsonObject

    // Portable Text text blocks: remint markDefs, then rewrite children.marks.
    const hasMarkDefs = Array.isArray(src.markDefs)
    const hasChildren = Array.isArray(src.children)
    if (hasMarkDefs || hasChildren) {
      const annotationKeyMap = new Map<string, string>()
      let markDefs: unknown[] | undefined
      if (hasMarkDefs) {
        markDefs = (src.markDefs as unknown[]).map((def) => {
          const oldKey =
            def !== null &&
            typeof def === 'object' &&
            typeof (def as JsonObject)._key === 'string'
              ? ((def as JsonObject)._key as string)
              : null
          const cloned = cloneArrayItem(def, used) as JsonObject
          if (oldKey && typeof cloned._key === 'string') {
            annotationKeyMap.set(oldKey, cloned._key)
          }
          return cloned
        })
      }

      let children: unknown[] | undefined
      if (hasChildren) {
        children = (src.children as unknown[]).map((child) => {
          const cloned = cloneArrayItem(child, used) as JsonObject
          if (Array.isArray(cloned.marks) && annotationKeyMap.size > 0) {
            cloned.marks = cloned.marks.map((mark) =>
              typeof mark === 'string' && annotationKeyMap.has(mark)
                ? annotationKeyMap.get(mark)!
                : mark,
            )
          }
          return cloned
        })
      }

      const out: JsonObject = {}
      for (const [key, child] of Object.entries(src)) {
        if (key === '_key' || key === 'markDefs' || key === 'children') continue
        out[key] = cloneWithFreshKeys(child, used, false)
      }
      if (markDefs) out.markDefs = markDefs
      if (children) out.children = children
      if (asArrayItem || typeof src._key === 'string') {
        out._key = mintUniqueKey(used)
      }
      return out
    }

    const out: JsonObject = {}
    for (const [key, child] of Object.entries(src)) {
      if (key === '_key') continue
      out[key] = cloneWithFreshKeys(child, used, false)
    }
    if (asArrayItem || typeof src._key === 'string') {
      out._key = mintUniqueKey(used)
    }
    return out
  }

  return value
}

/** Project empty check — same as hideZhPortableText / hasLocaleText for arrays. */
export function isPortableTextEmpty(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0
}

/**
 * Deep-clone EN Portable Text for writing into a ZH sibling field.
 * Always returns a new array (empty when EN is empty/missing).
 */
export function migrateBodyFromEn(enValue: unknown): unknown[] {
  if (!Array.isArray(enValue) || enValue.length === 0) return []
  const used = new Set<string>()
  return enValue.map((block) => cloneArrayItem(block, used)) as unknown[]
}
