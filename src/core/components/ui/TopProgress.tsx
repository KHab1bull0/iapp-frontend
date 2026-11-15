import s from './TopProgress.module.scss'

/**
 * A thin bar across the top of the screen while the next page is on its way:
 * the first sign a tap was heard, well before any skeleton. Decorative; the
 * skeleton beside it carries the "Loading…" for assistive tech.
 */
export function TopProgress() {
  return (
    <div className={s.track} aria-hidden data-top-progress>
      <div className={s.bar} />
    </div>
  )
}
