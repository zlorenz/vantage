/**
 * Text normalization and HTML extraction for TranslatePress dictionary lookups.
 * Shared by the translation audit script and (Phase 2) migration exporters.
 */

import { JSDOM } from 'jsdom';

/** Remove Gutenberg / WP block comment markers. */
export function stripWpBlockComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/** Collapse whitespace and trim. */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Strip TranslatePress artifacts like Chinese full stop + leftover English period (`。.`)
 * that appear when TRP appends `.` after a already-translated sentence ending in `。`.
 */
export function cleanTrpArtifacts(text: string): string {
  return text
    .replace(/([。！？])\./g, '$1')
    .replace(/\s*\[\s*[….]{1,3}\s*\]\s*/g, '')
    .replace(/……\.?$/g, '');
}

/**
 * Normalize strings for TRP dictionary matching (nbsp, curly quotes, dashes).
 * Avoids JSDOM when the input has no tags — important for indexing large dicts.
 */
export function normalizeLookupKey(s: string): string {
  let text = s;
  if (/<[^>]+>/i.test(s)) {
    text = htmlToPlainText(s) || s;
  }
  return normalizeWhitespace(
    text
      .replace(/\u00a0/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/[\u2018\u2019\u201A\u2032\u0060]/g, "'")
      .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function longestCommonPrefixLength(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i += 1;
  return i;
}

function isTruncatedTrpValue(value: string): boolean {
  return /\[\s*[….]{1,3}\s*\]|……\.?$/.test(value);
}

/**
 * Partial TRP rows often end mid-phrase (trailing comma, “导演说”, “摄影师”).
 * Reject those so we keep searching / fall back to curated overrides.
 */
export function translationLooksIncomplete(zh: string): boolean {
  const t = cleanTrpArtifacts(zh).trim();
  if (!t) return true;
  if (/[，、,;：:\s]$/.test(t)) return true;
  if (/(?:摄影师|导演说|并由|补充道)$/.test(t)) return true;
  return false;
}


/**
 * When TRP stored a longer string than the current segment, keep Chinese that
 * roughly matches the segment length (stop at a sentence boundary).
 */
function truncateZhToRatio(zh: string, ratio: number): string {
  const cleaned = cleanTrpArtifacts(zh).trim();
  if (!cleaned) return cleaned;
  if (ratio >= 0.92) return cleaned;

  const target = Math.max(8, Math.ceil(cleaned.length * Math.min(1, Math.max(0.35, ratio))));
  let cut = -1;
  const hi = Math.min(cleaned.length - 1, Math.floor(target * 1.25));
  const lo = Math.floor(target * 0.4);
  for (let i = hi; i >= lo; i -= 1) {
    if ('。！？'.includes(cleaned[i]!)) {
      cut = i + 1;
      break;
    }
  }
  if (cut > 0) return cleaned.slice(0, cut).trim();

  const first = cleaned.match(/^.*?[。！？]/);
  return first ? first[0] : cleaned.slice(0, target).trim();
}

function preferTranslation(a: string, b: string): string {
  const aTrunc = isTruncatedTrpValue(a);
  const bTrunc = isTruncatedTrpValue(b);
  if (aTrunc !== bTrunc) return aTrunc ? b : a;
  return a.length >= b.length ? a : b;
}

/** Lazy normalized index over a TRP dictionary Map. */
const normalizedIndexCache = new WeakMap<
  Map<string, string>,
  { exact: Map<string, string>; long: Array<{ key: string; value: string }> }
>();

function getNormalizedIndex(dict: Map<string, string>): {
  exact: Map<string, string>;
  long: Array<{ key: string; value: string }>;
} {
  const cached = normalizedIndexCache.get(dict);
  if (cached) return cached;

  const exact = new Map<string, string>();
  const long: Array<{ key: string; value: string }> = [];

  for (const [rawKey, rawValue] of dict) {
    const key = normalizeLookupKey(rawKey);
    const value = cleanTrpArtifacts(rawValue || '').trim();
    if (key.length < 2 || !value) continue;
    if (normalizeLookupKey(value) === key) continue;

    const existing = exact.get(key);
    exact.set(key, existing ? preferTranslation(existing, value) : value);

    if (key.length >= 40) {
      long.push({ key, value: exact.get(key)! });
    }
  }

  // Prefer longest non-truncated value per long key (rebuild from exact)
  for (let i = 0; i < long.length; i += 1) {
    long[i]!.value = exact.get(long[i]!.key) || long[i]!.value;
  }

  const index = { exact, long };
  normalizedIndexCache.set(dict, index);
  return index;
}

/**
 * Flatten HTML to plain text (tags removed, entities decoded).
 * Used when TRP stores the visible rendered string, not raw markup.
 */
export function htmlToPlainText(html: string): string {
  const cleaned = stripWpBlockComments(html);
  if (!cleaned.trim()) return '';

  const dom = new JSDOM(`<body>${cleaned}</body>`);
  const text = dom.window.document.body.textContent ?? '';
  return normalizeWhitespace(text);
}

/** Individual visible text nodes from block-level elements (p, headings, li). */
export function extractHtmlTextSegments(html: string): string[] {
  const cleaned = stripWpBlockComments(html);
  if (!cleaned.trim()) return [];

  const dom = new JSDOM(`<body>${cleaned}</body>`);
  const segments: string[] = [];
  const selectors = 'p, h1, h2, h3, h4, h5, h6, li';

  for (const el of dom.window.document.querySelectorAll(selectors)) {
    const text = normalizeWhitespace(el.textContent ?? '');
    if (text.length >= 2) segments.push(text);
  }

  if (!segments.length) {
    const fallback = htmlToPlainText(cleaned);
    if (fallback.length >= 2) segments.push(fallback);
  }

  return segments;
}

/**
 * Translate block-level HTML segments in place; returns rebuilt body HTML
 * when at least one segment has a dictionary hit.
 */
export function buildTranslatedBodyHtml(
  html: string,
  dict: Map<string, string>,
): string | undefined {
  const cleaned = stripWpBlockComments(html);
  if (!cleaned.trim()) return undefined;

  const dom = new JSDOM(`<body>${cleaned}</body>`);
  const body = dom.window.document.body;
  let anyTranslated = false;

  for (const el of body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')) {
    const raw = el.innerHTML.trim();
    if (!raw) continue;

    const lookup = lookupInDictionary(dict, raw);
    if (!lookup.hit || !lookup.translated) {
      const plain = normalizeWhitespace(el.textContent ?? '');
      if (plain.length < 2) continue;
      const plainLookup = lookupInDictionary(dict, plain);
      if (!plainLookup.hit || !plainLookup.translated) continue;
      el.textContent = cleanTrpArtifacts(plainLookup.translated);
      anyTranslated = true;
      continue;
    }

    el.innerHTML = cleanTrpArtifacts(lookup.translated);
    anyTranslated = true;
  }

  if (!anyTranslated) return undefined;
  return cleanTrpArtifacts(body.innerHTML);
}

/** Returns translated value only when it differs meaningfully from the original. */
export function distinctTranslation(
  original: string,
  translated: string | undefined,
): string | undefined {
  if (!translated?.trim()) return undefined;
  const cleaned = cleanTrpArtifacts(translated);
  const a = normalizeWhitespace(htmlToPlainText(original) || original);
  const b = normalizeWhitespace(htmlToPlainText(cleaned) || cleaned);
  if (!b || a === b) return undefined;
  return cleaned;
}

/** Lookup keys to try against the TRP dictionary, in priority order. */
export function translationLookupKeys(original: string): string[] {
  const trimmed = original.trim();
  if (!trimmed) return [];

  const keys = new Set<string>();
  keys.add(trimmed);
  keys.add(normalizeWhitespace(trimmed));
  keys.add(normalizeLookupKey(trimmed));

  const plain = htmlToPlainText(trimmed);
  if (plain) {
    keys.add(plain);
    keys.add(normalizeLookupKey(plain));
  }

  for (const segment of extractHtmlTextSegments(trimmed)) {
    keys.add(segment);
    keys.add(normalizeLookupKey(segment));
  }

  return [...keys];
}

export interface DictionaryLookupResult {
  hit: boolean;
  translated?: string;
  matchedKey?: string;
  triedKeys: string[];
}

export function lookupInDictionary(
  dict: Map<string, string>,
  original: string,
): DictionaryLookupResult {
  const triedKeys = translationLookupKeys(original);
  for (const key of triedKeys) {
    const translated = dict.get(key)?.trim();
    if (translated && translated !== key) {
      return {
        hit: true,
        translated: cleanTrpArtifacts(translated),
        matchedKey: key,
        triedKeys,
      };
    }
  }

  const needle = normalizeLookupKey(original);
  if (needle.length >= 2) {
    const { exact, long } = getNormalizedIndex(dict);
    const exactHit = exact.get(needle);
    if (exactHit) {
      return {
        hit: true,
        translated: exactHit,
        matchedKey: `[normalized] ${needle.slice(0, 80)}`,
        triedKeys,
      };
    }

    // Prefix / near-prefix match for TRP strings that span multiple blocks.
    if (needle.length >= 40) {
      let best:
        | {
            lcp: number;
            key: string;
            value: string;
            mode: 'equal' | 'key-longer' | 'needle-longer';
          }
        | undefined;

      for (const entry of long) {
        const lcp = longestCommonPrefixLength(entry.key, needle);
        if (lcp < 50) continue;
        if (lcp < Math.min(entry.key.length, needle.length) * 0.85) continue;

        let mode: 'equal' | 'key-longer' | 'needle-longer' = 'equal';
        if (entry.key.length > needle.length + 8) mode = 'key-longer';
        else if (needle.length > entry.key.length + 8) mode = 'needle-longer';

        if (
          !best ||
          lcp > best.lcp ||
          (lcp === best.lcp &&
            Math.abs(entry.key.length - needle.length) <
              Math.abs(best.key.length - needle.length))
        ) {
          best = { lcp, key: entry.key, value: entry.value, mode };
        }
      }

      if (best) {
        let translated = best.value;
        if (best.mode === 'key-longer') {
          translated = truncateZhToRatio(
            best.value,
            needle.length / Math.max(1, best.key.length),
          );
        } else if (best.mode === 'needle-longer') {
          const rest = needle.slice(best.key.length).trim();
          if (rest.length >= 20) {
            const restExact = exact.get(normalizeLookupKey(rest));
            if (restExact) {
              translated = `${cleanTrpArtifacts(best.value)}${restExact}`;
            } else {
              // Incomplete TRP prefix — do not ship truncated Chinese.
              translated = '';
            }
          }
        }

        if (translated.trim() && !translationLooksIncomplete(translated)) {
          return {
            hit: true,
            translated: cleanTrpArtifacts(translated),
            matchedKey: `[fuzzy:${best.mode}] ${best.key.slice(0, 80)}`,
            triedKeys,
          };
        }
      }
    }
  }

  return { hit: false, triedKeys };
}

/** Synchronous exact-key lookup (current migration export behaviour). */
export function exactDictionaryLookup(
  dict: Map<string, string>,
  original: string,
): string | undefined {
  const hit = dict.get(original.trim())?.trim();
  return hit && hit !== original.trim() ? hit : undefined;
}
