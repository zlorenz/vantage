/**
 * Decode common HTML entities in CMS string fields migrated from WordPress.
 *
 * WordPress taxonomy names are often stored with entities (e.g. `&amp;`).
 * React text nodes render those literally unless decoded first.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
};

export function decodeHtmlEntities(text: string): string {
  if (!text.includes('&')) return text;

  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const code =
        entity[1].toLowerCase() === 'x'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    const decoded = NAMED_ENTITIES[entity.toLowerCase()];
    return decoded ?? match;
  });
}
