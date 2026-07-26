export type LocalePairOptions = {
  /** Sibling Chinese field name (e.g. `titleZh` or `xinpianchangUrl`). */
  zhName: string
  /** Textarea rows when the pair uses `text` inputs. */
  rows?: number
  /** When true, the shared field label is muted (optional). */
  optional?: boolean
}

export function getLocalePairOptions(
  schemaType: {options?: unknown} | undefined,
): LocalePairOptions | undefined {
  const options = schemaType?.options as {localePair?: LocalePairOptions} | undefined
  const pair = options?.localePair
  if (!pair?.zhName) return undefined
  return pair
}
