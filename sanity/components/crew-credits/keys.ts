/** Generate Sanity array item keys compatible with Studio. */
export function newArrayKey(): string {
  return Math.random().toString(36).slice(2, 14)
}
