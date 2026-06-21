export type PostMeta = Record<string, string>;

/** Parse ACF repeater rows from flat postmeta keys like `prefix_0_field`. */
export function parseAcfRepeater(
  meta: PostMeta,
  prefix: string
): Record<string, string>[] {
  const rowPattern = new RegExp(`^${prefix}_(\\d+)_(.+)$`);
  const rows = new Map<number, Record<string, string>>();

  for (const [key, value] of Object.entries(meta)) {
    const match = key.match(rowPattern);
    if (!match) continue;
    const index = Number(match[1]);
    const field = match[2];
    if (!rows.has(index)) rows.set(index, {});
    rows.get(index)![field] = value;
  }

  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row);
}

export function getMeta(meta: PostMeta, key: string): string {
  return (meta[key] ?? '').trim();
}

export function getMetaOrFallback(meta: PostMeta, ...keys: string[]): string {
  for (const key of keys) {
    const val = getMeta(meta, key);
    if (val) return val;
  }
  return '';
}
