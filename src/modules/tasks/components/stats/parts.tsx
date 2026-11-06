import { SegmentedControl } from '@/core/components/ui/SegmentedControl'
import { useTasksT } from '@/modules/tasks/i18n'
import type { Period } from './points'

export function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const t = useTasksT()
  return (
    <SegmentedControl
      size="sm"
      label={t.stats.period}
      value={value}
      onChange={onChange}
      options={[
        { value: 'daily', label: t.stats.daily },
        { value: 'monthly', label: t.stats.monthly },
      ]}
    />
  )
}
