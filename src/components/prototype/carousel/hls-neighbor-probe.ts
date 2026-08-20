/**
 * TEMP-DIAGNOSTIC — remove after investigation
 *
 * Flip `HLS_NEIGHBOR_PROBE_MODE` between real-device runs:
 * - 'baseline' — current 300ms neighbor-mount lag, no autoplay-pause trick
 * - 'early-mount' — 0ms lag (neighbors mount as soon as they enter ±1)
 * - 'early-mount-autoplay' — 0ms lag + muted play().then(pause) on inactive neighbors
 */

export type HlsNeighborProbeMode =
  | 'baseline'
  | 'early-mount'
  | 'early-mount-autoplay';

// ← change this between Safari/Chrome runs
export const HLS_NEIGHBOR_PROBE_MODE: HlsNeighborProbeMode = 'baseline';

export function probeNeighborMountDelayMs(): number {
  return HLS_NEIGHBOR_PROBE_MODE === 'baseline' ? 300 : 0;
}

export function probeUseMutedAutoplayPause(): boolean {
  return HLS_NEIGHBOR_PROBE_MODE === 'early-mount-autoplay';
}
