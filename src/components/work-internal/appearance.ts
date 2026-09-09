/**
 * Personal display density prefs for /work-internal.
 * localStorage only — not URL/shared state.
 */

export type CardSize = 's' | 'm' | 'l';
export type TitleLines = 1 | 2;

export interface LibraryAppearance {
  cardSize: CardSize;
  /** Cards only — show title + date overlay on the poster. */
  showCardInfo: boolean;
  titleLines: TitleLines;
}

export const DEFAULT_APPEARANCE: LibraryAppearance = {
  cardSize: 'm',
  showCardInfo: true,
  titleLines: 2,
};

const STORAGE_KEY = 'vp-work-internal-appearance';

function isCardSize(value: unknown): value is CardSize {
  return value === 's' || value === 'm' || value === 'l';
}

function isTitleLines(value: unknown): value is TitleLines {
  return value === 1 || value === 2;
}

export function readAppearance(): LibraryAppearance {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<LibraryAppearance>;
    return {
      cardSize: isCardSize(parsed.cardSize)
        ? parsed.cardSize
        : DEFAULT_APPEARANCE.cardSize,
      showCardInfo:
        typeof parsed.showCardInfo === 'boolean'
          ? parsed.showCardInfo
          : DEFAULT_APPEARANCE.showCardInfo,
      titleLines: isTitleLines(parsed.titleLines)
        ? parsed.titleLines
        : DEFAULT_APPEARANCE.titleLines,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function writeAppearance(prefs: LibraryAppearance): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/** CSS data-attribute payload for the library shell. */
export function appearanceDataAttrs(prefs: LibraryAppearance): {
  'data-card-size': CardSize;
  'data-card-info': 'on' | 'off';
  'data-title-lines': '1' | '2';
} {
  return {
    'data-card-size': prefs.cardSize,
    'data-card-info': prefs.showCardInfo ? 'on' : 'off',
    'data-title-lines': prefs.titleLines === 1 ? '1' : '2',
  };
}
