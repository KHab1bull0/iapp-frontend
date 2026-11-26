import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Sparkles } from 'lucide-react'
import { fetchTodayInspiration, todayInspirationKey } from '@/core/api/inspirations'
import { useToday } from '@/core/hooks/useToday'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './HomePage.module.scss'

/** Under the greeting: one of the user's own entries, the same all day. */
export function TodayInspiration() {
  const t = useCoreT().settings.inspiration
  const today = useToday()
  const { data: entry, isLoading } = useQuery({
    queryKey: todayInspirationKey(today),
    queryFn: () => fetchTodayInspiration(today),
  })

  if (isLoading) return <div className={s.inspiration} aria-busy="true" />
  if (!entry) {
    return (
      <Link to="/settings/inspirations" className={s.inspirationEmpty}>
        <Sparkles size={16} aria-hidden /> {t.homeEmpty} <ChevronRight size={16} aria-hidden />
      </Link>
    )
  }
  return (
    <figure className={s.inspiration}>
      <Sparkles size={16} className={s.inspirationIcon} aria-hidden />
      <blockquote className={s.inspirationText}>{entry.text}</blockquote>
      {entry.kind && <figcaption className={s.inspirationKind}>{t.kinds[entry.kind]}</figcaption>}
    </figure>
  )
}
