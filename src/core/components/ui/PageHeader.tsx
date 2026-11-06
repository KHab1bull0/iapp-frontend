import { useEffect, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import s from './PageHeader.module.scss'

interface Props {
  title: string
  subtitle?: ReactNode
  /** Buttons on the right of the title. */
  actions?: ReactNode
  /** Under the title: a module's page switcher, filters. Sticks to the top with the compact title. */
  children?: ReactNode
}

/**
 * A page's large title. Once it scrolls away, a compact bar with the same
 * title stays at the top (on phones), so you always know where you are.
 */
export function PageHeader({ title, subtitle, actions, children }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const el = titleRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <div className={clsx(s.bar, compact && s.barShown)} aria-hidden={!compact}>
        <span className={s.barTitle}>{title}</span>
      </div>
      <header className={s.header}>
        <div className={s.titleRow}>
          <div className={s.titles}>
            <h1 ref={titleRef} className={s.title}>
              {title}
            </h1>
            {subtitle && <div className={s.subtitle}>{subtitle}</div>}
          </div>
          {actions && <div className={s.actions}>{actions}</div>}
        </div>
        {children && <div className={s.below}>{children}</div>}
      </header>
    </>
  )
}
