/**
 * Shared overlap/fade + overlay parallax styles.
 *
 * Native scroll already moves both slides at 100%. These transforms are
 * supplementary: outgoing media is counter-shifted so its *visual* speed is
 * OUTGOING_SPEED_FACTOR of the incoming slide. Media opacity/blur are
 * mirrored: outgoing goes 1 → OUTGOING_OPACITY_MIN and 0 → OUTGOING_BLUR_MAX_PX;
 * incoming goes the reverse (floor+blur → sharp full opacity). While blurred,
 * the media stack scales up slightly so soft edges fall outside __media's
 * overflow clip (avoids a dark fringe against the slide's black bg). Overlay
 * copy travels OVERLAY_SPEED_FACTOR of native scroll so text outpaces its own
 * background; opacity/blur/scale are media-stack-only.
 */

export const OUTGOING_SPEED_FACTOR = 0.22;
/** Opacity floor at the dark end of the media fade (outgoing end / incoming start). */
export const OUTGOING_OPACITY_MIN = 0.2;
/** Peak blur at the dark end of the media fade (px). */
export const OUTGOING_BLUR_MAX_PX = 10;
/**
 * Peak scale on the blurred stack at max blur. Soft alpha edges land outside
 * the overflow clip so they don't darken against the slide background.
 */
export const OUTGOING_BLUR_EDGE_SCALE = 1.06;
/** Visual overlay travel vs native scroll (1 = lockstep, >1 = leads media). */
export const OVERLAY_SPEED_FACTOR = 1.35;
export const SETTLE_EPSILON_PX = 1;

export type TransitionLayerStyles = {
  transform: string;
  stackTransform: string;
  opacity: number;
  filter: string;
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
/** Opacity/blur target inside media — keeps filter halo clipped by overflow. */
const MEDIA_STACK_SELECTOR = '.vp-proto-carousel__media-stack';
/** Parallax target: copy wrapper only — scrim sibling stays static. */
const OVERLAY_SELECTOR = '.vp-proto-carousel__overlay-copy';

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/** Scale that tracks blur so the soft fringe is cropped by overflow:hidden. */
function stackScaleForBlur(blurPx: number): string {
  if (blurPx <= 0 || OUTGOING_BLUR_MAX_PX <= 0) return 'none';
  const t = blurPx / OUTGOING_BLUR_MAX_PX;
  const scale = 1 + t * (OUTGOING_BLUR_EDGE_SCALE - 1);
  return `scale(${scale})`;
}

/**
 * @param progress 0 = outgoing sharp/full / incoming dark+blurred;
 *                 1 = incoming sharp/full / outgoing dark+blurred
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
  const outgoingBlurPx = p * OUTGOING_BLUR_MAX_PX;
  const incomingBlurPx = (1 - p) * OUTGOING_BLUR_MAX_PX;
  return {
    outgoing: {
      transform: `translateY(${direction * outgoingShiftPct}%)`,
      stackTransform: stackScaleForBlur(outgoingBlurPx),
      opacity: OUTGOING_OPACITY_MIN + (1 - OUTGOING_OPACITY_MIN) * (1 - p),
      filter: outgoingBlurPx > 0 ? `blur(${outgoingBlurPx}px)` : 'none',
      overlayTransform: `translateY(${-direction * p * overlayLeadPct}%)`,
    },
    incoming: {
      transform: 'translateY(0%)',
      stackTransform: stackScaleForBlur(incomingBlurPx),
      opacity: OUTGOING_OPACITY_MIN + (1 - OUTGOING_OPACITY_MIN) * p,
      filter: incomingBlurPx > 0 ? `blur(${incomingBlurPx}px)` : 'none',
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
  }
  const stack = slide.querySelector<HTMLElement>(MEDIA_STACK_SELECTOR);
  if (stack) {
    stack.style.opacity = '';
    stack.style.filter = '';
    stack.style.transform = '';
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
  }
  const stack = slide.querySelector<HTMLElement>(MEDIA_STACK_SELECTOR);
  if (stack) {
    stack.style.opacity = String(styles.opacity);
    stack.style.filter = styles.filter;
    stack.style.transform =
      styles.stackTransform === 'none' ? '' : styles.stackTransform;
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
