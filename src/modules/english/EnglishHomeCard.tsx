import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flame, Languages, Play, Plus } from 'lucide-react'
import { HomeCard } from '@/core/components/HomeCard'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useToday } from '@/core/hooks/useToday'
import { useQuickAdd } from '@/core/quickAdd/context'
import { englishKeys, fetchReview, fetchStats } from './api/english'
import { useEnglishT } from './i18n'
import s from './EnglishHomeCard.module.scss'

/** Home: how many words wait, one tap into review, and the streak to keep. */
export function EnglishHomeCard() {
  const t = useEnglishT()
  const today = useToday()
  const quickAdd = useQuickAdd()
  // Same keys as the Review and Statistics pages, so they share requests.
  const { data, isError } = useQuery({
    queryKey: englishKeys.review(today),
    queryFn: () => fetchReview(today),
  })
  const { data: stats } = useQuery({
    queryKey: englishKeys.stats(today),
    queryFn: () => fetchStats(today),
  })

  const n = data?.length ?? 0
  const streak = stats?.streak ?? 0

  return (
    <HomeCard
      icon={Languages}
      title={t.title}
      to="/english"
      linkLabel={t.home.open}
      accessory={
        streak > 0 && (
          <span className={s.streak}>
            <Flame size={16} aria-hidden /> {t.home.streak(streak)}
          </span>
        )
      }
    >
      {isError ? (
        <div className={s.sub}>{t.home.failed}</div>
      ) : !data ? (
        <Skeleton height={48} radius={14} />
      ) : n === 0 ? (
        <EmptyState
          compact
          title={stats?.reviewedToday ? t.home.allDone : t.nothingToday}
          description={stats?.reviewedToday ? t.home.reviewedToday(stats.reviewedToday) : undefined}
          action={{ label: t.home.addWord, icon: Plus, onClick: () => quickAdd.open('english.word') }}
        />
      ) : (
        <>
          <div className={s.count}>{t.home.count(n)}</div>
          <Link to="/english/review" className={s.start}>
            <Play size={18} aria-hidden /> {t.home.start}
          </Link>
        </>
      )}
    </HomeCard>
  )
}
