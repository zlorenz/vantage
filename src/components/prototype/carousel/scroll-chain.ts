/**
 * When the carousel is an in-flow hero, wheel/keys at the first/last slide
 * must release to document scroll so the page can move into content below
 * (and back). Internal snap paging is unchanged.
 *
 * If the document has already scrolled (contact section in view), the
 * carousel must not intercept — otherwise the user cannot scroll the page
 * back up through the hero.
 */

export const PAGE_SCROLL_RELEASE_PX = 1;

export function shouldReleaseWheelToPage(options: {
  pageScrollY: number;
  activeIndex: number;
  lastIndex: number;
  deltaY: number;
}): boolean {
  const {pageScrollY, activeIndex, lastIndex, deltaY} = options;
  if (pageScrollY > PAGE_SCROLL_RELEASE_PX) return true;
  if (deltaY < 0 && activeIndex <= 0) return true;
  if (deltaY > 0 && activeIndex >= lastIndex) return true;
  return false;
}

export function shouldReleaseKeyToPage(options: {
  pageScrollY: number;
  activeIndex: number;
  lastIndex: number;
  key: string;
}): boolean {
  const {pageScrollY, activeIndex, lastIndex, key} = options;
  if (pageScrollY > PAGE_SCROLL_RELEASE_PX) return true;
  if ((key === 'ArrowDown' || key === 'PageDown') && activeIndex >= lastIndex) {
    return true;
  }
  if ((key === 'ArrowUp' || key === 'PageUp') && activeIndex <= 0) {
    return true;
  }
  if (key === 'Home' && activeIndex <= 0) return true;
  if (key === 'End' && activeIndex >= lastIndex) return true;
  return false;
}
