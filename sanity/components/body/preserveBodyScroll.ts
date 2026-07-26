/**
 * Focus-compose uses `.vp-body-pt-focus` as the scroll surface.
 * Sanity’s scroll-into-view / dialog focus often resets that to 0 —
 * snapshot + restore around actions that open dialogs or remove blocks.
 */

const FOCUS_SCROLL_SEL = '.vp-body-pt-focus'

export function getBodyFocusScrollEl(): HTMLElement | null {
  return document.querySelector(FOCUS_SCROLL_SEL)
}

export function preserveBodyFocusScroll(run: () => void): void {
  const el = getBodyFocusScrollEl()
  const top = el?.scrollTop ?? 0
  run()
  const restore = () => {
    const current = getBodyFocusScrollEl()
    if (current) current.scrollTop = top
  }
  restore()
  requestAnimationFrame(() => {
    restore()
    requestAnimationFrame(restore)
  })
  // Dialog focus / PTE selection settle a tick later
  window.setTimeout(restore, 0)
  window.setTimeout(restore, 50)
  window.setTimeout(restore, 150)
}

/** Prevent button mousedown from stealing PTE focus (which triggers scroll-into-view). */
export function preventFocusSteal(event: {preventDefault: () => void}): void {
  event.preventDefault()
}
