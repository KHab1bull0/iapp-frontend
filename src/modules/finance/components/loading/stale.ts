import s from './Loading.module.scss'

/** The class for content that stays on screen while newer data loads: dimmed while stale. */
export function staleClass(stale: boolean) {
  return stale ? s.stale : s.fresh
}
