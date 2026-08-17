/**
 * Shared overlap/fade + overlay parallax styles.
 *
 * Native scroll already moves both slides at 100%. These transforms are
 * supplementary: outgoing media is counter-shifted so its *visual* speed is
 * OUTGOING_SPEED_FACTOR of the incoming slide, and it fades 1 → 0.
 * Overlay copy travels OVERLAY_SPEED_FACTOR of native scroll so text
 * outpaces its own background; opacity is not tied to progress.
 */

export const OUTGOING_SPEED_FACTOR = 0.22;
/** Visual overlay travel vs native scroll (1 = lockstep, >1 = leads media). */
export const OVERLAY_SPEED_FACTOR = 1.22;
export const SETTLE_EPSILON_PX = 1;

export type TransitionLayerStyles = {
  transform: string;
  opacity: number;
  overlayTransform: string;
};

export type ScrollTransitionState =
  | {settled: true; index: number}
  | {
      settled: false;
      progress: number;
      direction: 1 | -1;
      outgoingIndex: number;
      incomingIndex: number;
    };

const MEDIA_SELECTOR = '.vp-proto-carousel__media';
const OVERLAY_SELECTOR = '.vp-proto-carousel__overlay';

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/**
 * @param progress 0 = outgoing fully active / incoming not yet visible;
 *                 1 = incoming fully active / outgoing fully faded
 * @param direction 1 = scrolling down (incoming from below),
 *                  -1 = scrolling up (incoming from above)
 */
export function getTransitionStyles(
  progress: number,
  direction: 1 | -1 = 1,
): {outgoing: TransitionLayerStyles; incoming: TransitionLayerStyles} {
  const p = clamp01(progress);
  const outgoingShiftPct = p * (1 - OUTGOING_SPEED_FACTOR) * 100;
  const overlayLeadPct = (OVERLAY_SPEED_FACTOR - 1) * 100;
  return {
    outgoing: {
      transform: `translateY(${direction * outgoingShiftPct}%)`,
      opacity: 1 - p,
      overlayTransform: `translateY(${-direction * p * overlayLeadPct}%)`,
    },
    incoming: {
      transform: 'translateY(0%)',
      opacity: 1,
      overlayTransform: `translateY(${direction * (1 - p) * overlayLeadPct}%)`,
    },
  };
}

export function getScrollTransitionState(
  scrollTop: number,
  height: number,
  lastSettledIndex: number,
  lastIndex: number,
): ScrollTransitionState {
  if (height <= 0 || lastIndex <= 0) {
    return {settled: true, index: 0};
  }

  const raw = Math.min(Math.max(scrollTop / height, 0), lastIndex);
  const nearest = Math.round(raw);
  if (Math.abs(scrollTop - nearest * height) < SETTLE_EPSILON_PX) {
    return {settled: true, index: Math.min(Math.max(nearest, 0), lastIndex)};
  }

  const lower = Math.min(Math.max(Math.floor(raw), 0), lastIndex - 1);
  const upper = lower + 1;
  const fraction = raw - lower;

  if (raw > lastSettledIndex) {
    return {
      settled: false,
      progress: clamp01(fraction),
      direction: 1,
      outgoingIndex: lower,
      incomingIndex: upper,
    };
  }

  return {
    settled: false,
    progress: clamp01(1 - fraction),
    direction: -1,
    outgoingIndex: upper,
    incomingIndex: lower,
  };
}

export function clearSlideOverlap(slide: HTMLElement | null): void {
  if (!slide) return;
  slide.style.zIndex = '';
  const media = slide.querySelector<HTMLElement>(MEDIA_SELECTOR);
  if (media) {
    media.style.transform = '';
    media.style.opacity = '';
  }
  const overlay = slide.querySelector<HTMLElement>(OVERLAY_SELECTOR);
  if (overlay) overlay.style.transform = '';
}

function paintSlideOverlap(
  slide: HTMLElement | null,
  styles: TransitionLayerStyles,
  zIndex: string,
): void {
  if (!slide) return;
  slide.style.zIndex = zIndex;
  const media = slide.querySelector<HTMLElement>(MEDIA_SELECTOR);
  if (media) {
    media.style.transform = styles.transform;
    media.style.opacity = String(styles.opacity);
  }
  const overlay = slide.querySelector<HTMLElement>(OVERLAY_SELECTOR);
  if (overlay) overlay.style.transform = styles.overlayTransform;
}

export type OverlapPair = {outgoing: number; incoming: number};

export function syncOverlapToSlides(
  slides: Array<HTMLElement | null>,
  state: ScrollTransitionState,
  prev: OverlapPair | null,
): OverlapPair | null {
  if (state.settled) {
    if (prev) {
      clearSlideOverlap(slides[prev.outgoing] ?? null);
      clearSlideOverlap(slides[prev.incoming] ?? null);
    }
    return null;
  }

  if (
    prev &&
    (prev.outgoing !== state.outgoingIndex || prev.incoming !== state.incomingIndex)
  ) {
    clearSlideOverlap(slides[prev.outgoing] ?? null);
    clearSlideOverlap(slides[prev.incoming] ?? null);
  }

  const styles = getTransitionStyles(state.progress, state.direction);
  paintSlideOverlap(slides[state.outgoingIndex] ?? null, styles.outgoing, '1');
  paintSlideOverlap(slides[state.incomingIndex] ?? null, styles.incoming, '2');
  return {outgoing: state.outgoingIndex, incoming: state.incomingIndex};
}
