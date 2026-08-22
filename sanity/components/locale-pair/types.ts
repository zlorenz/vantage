export type LocalePairOptions = {
  /** Sibling Chinese field name (e.g. `titleZh` or `xinpianchangUrl`). */
  zhName: string
  /** Textarea rows when the pair uses `text` inputs. */
  rows?: number
  /** When true, the shared field label is muted (optional). */
  optional?: boolean
  /**
   * When true, editors may edit the ZH sibling (normally editor-locked).
   * Use for non-translation pairs like Vimeo / Xinpianchang embed URLs.
   */
  editorCanEditZh?: boolean
  /** Document field path used by the EN slug Generate button (e.g. `title`). */
  slugSource?: string
  /** Document field path used by the ZH slug Generate button (e.g. `titleZh`). */
  slugZhSource?: string
  /** Max slug length when generating (defaults to 96). */
  slugMaxLength?: number
  /** When true, EN url control includes the Vimeo library picker. */
  vimeoPicker?: boolean
}

export function getLocalePairOptions(
  schemaType: {options?: unknown} | undefined,
): LocalePairOptions | undefined {
  const options = schemaType?.options as {localePair?: LocalePairOptions} | undefined
  const pair = options?.localePair
  if (!pair?.zhName) return undefined
  return pair
}
