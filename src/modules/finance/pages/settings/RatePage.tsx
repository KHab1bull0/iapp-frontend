import { RateSettings } from '@/modules/finance/components/rates/RateSettings'
import { useFinanceT } from '@/modules/finance/i18n'
import { FinanceSettingsSubpage } from './FinanceSettingsSubpage'

/** Finance settings → the dollar rate (opened from the rate badge too). */
export function RatePage() {
  const t = useFinanceT()
  return (
    <FinanceSettingsSubpage title={t.rate.title} description={t.rate.sub}>
      <RateSettings />
    </FinanceSettingsSubpage>
  )
}
