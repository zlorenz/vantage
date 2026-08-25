/**
 * Nearest snap from Embla scrollProgress.
 * Loop: circular distance on [0,1) — linear |snap - progress| sticks on the
 * last index across the wrap (progress crawls 0.99→1 then jumps to 0).
 * Non-loop: linear distance. Wrapping progress=1 onto [0,1) maps the last
 * snap back to 0, which is why a 2-card filter kept the first card active.
 * Also required while scrubbing: selectedScrollSnap() does not advance until
 * settle, so progress-based nearest is what keeps is-active + windowing live.
 */
export function nearestSnapIndexFromProgress(
  progress: number,
  snaps: number[],
  loop: boolean,
): number {
  if (snaps.length <= 1) return 0;
  if (!loop) {
    const clamped = Math.min(1, Math.max(0, progress));
    let nearest = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < snaps.length; i++) {
      const dist = Math.abs(snaps[i] - clamped);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = i;
      }
    }
    return nearest;
  }
  const norm = ((progress % 1) + 1) % 1;
  let nearest = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < snaps.length; i++) {
    const dist = Math.abs(snaps[i] - norm);
    const circular = Math.min(dist, 1 - dist);
    if (circular < bestDist) {
      bestDist = circular;
      nearest = i;
    }
  }
  return nearest;
}
