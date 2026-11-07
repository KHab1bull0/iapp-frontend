/**
 * Colours for charts and data marks. Recharts writes these into SVG
 * attributes, which can't resolve var(--…), so they are literal hex here, in
 * one place, rather than scattered across chart components. They are fills
 * (bars, lines, dots), never text, so they keep their brightness in both
 * themes.
 */
export const CHART = {
  /** A running total or the module's own series. */
  primary: '#16A34A',
  /** Lighter companion to `primary`: per-day bars under its line. */
  primarySoft: '#86EFAC',
  income: '#22C55E',
  expense: '#EF4444',
  neutral: '#94A3B8',
} as const

/**
 * Distinct series colours, in order, for things with no colour of their own
 * (repeat types, levels). Chosen to stay apart for the common colour-vision
 * deficiencies; never rely on colour alone, always label the series too.
 */
export const SERIES = ['#3B82F6', '#F59E0B', '#EC4899', '#14B8A6', '#8B5CF6', '#94A3B8'] as const

/**
 * One hue, light to dark, for ordered steps of the same thing (English review
 * levels: the longer a word stays away, the darker). Pick evenly spread
 * steps with `rampSteps`.
 */
export const GREEN_RAMP = ['#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D', '#166534'] as const

/** `n` colours from a ramp, spread from its light end to its dark end. */
export function rampSteps(ramp: readonly string[], n: number): string[] {
  if (n <= 0) return []
  if (n === 1) return [ramp[Math.floor(ramp.length / 2)]]
  return Array.from({ length: n }, (_, i) => ramp[Math.round((i * (ramp.length - 1)) / (n - 1))])
}

/** What people pick from for their own categories. */
export const CATEGORY_SWATCHES = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#0ea5e9', '#f43f5e', '#84cc16',
] as const
