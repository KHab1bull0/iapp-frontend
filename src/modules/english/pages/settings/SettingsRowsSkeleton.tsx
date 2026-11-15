import { Skeleton } from '@/core/components/ui/Skeleton'
import { Loading, SkeletonText } from '@/modules/english/components/Loading'
import e from './EnglishSettings.module.scss'

/**
 * A settings list's rows while they load: rows of the same height, the name
 * and its count as bars, and the edit and delete buttons as squares.
 */
export function SettingsRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Loading className={e.skeletonRows}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={e.row}>
          <span className={e.name}>
            <SkeletonText width={`${55 - i * 10}%`} line={20} />
          </span>
          <SkeletonText width={52} line={18} />
          <Skeleton width="var(--control-sm)" height="var(--control-sm)" radius={8} />
          <Skeleton width="var(--control-sm)" height="var(--control-sm)" radius={8} />
        </div>
      ))}
    </Loading>
  )
}
