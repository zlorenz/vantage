/**
 * Sanitize credit name HTML from Sanity (migrated from WordPress ACF).
 *
 * Mirrors the wp_kses allowlist in vp_portfolio_render_credits() — only
 * editor-controlled link/formatting tags are permitted.
 */

const ALLOWED_TAG =
  /^(a|br|strong|b|em|i|span)$/i;

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel', 'class']),
  span: new Set(['class']),
};

/** Strip event handlers and javascript: URLs from attribute values. */
function sanitizeAttrValue(value: string): string {
  const trimmed = value.trim();
  if (/^javascript:/i.test(trimmed)) return '';
  return trimmed.replace(/"/g, '&quot;');
}

/**
 * Returns HTML safe for dangerouslySetInnerHTML in credit name fields.
 * Plain text (no tags) is returned unchanged.
 */
export function sanitizeCreditHtml(input: string): string {
  if (!input.includes('<')) return input;

  return input.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tagName, rawAttrs) => {
    const tag = String(tagName).toLowerCase();
    if (!ALLOWED_TAG.test(tag)) return '';

    const isClosing = match.startsWith('</');
    if (isClosing) {
      return tag === 'br' ? '' : `</${tag}>`;
    }

    if (tag === 'br') return '<br />';

    const allowed = ALLOWED_ATTRS[tag];
    if (!allowed) return `<${tag}>`;

    const attrs: string[] = [];
    const attrPattern = /([a-z-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrPattern.exec(rawAttrs)) !== null) {
      const name = attrMatch[1].toLowerCase();
      if (!allowed.has(name)) continue;
      const value = sanitizeAttrValue(attrMatch[3] ?? attrMatch[4] ?? '');
      if (!value) continue;
      attrs.push(`${name}="${value}"`);
    }

    return attrs.length ? `<${tag} ${attrs.join(' ')}>` : `<${tag}>`;
  });
}
