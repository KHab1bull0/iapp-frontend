import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatAmount, formatShortDay, todayYmd } from '@/core/lib/format'
import { toast } from '@/core/components/ui/toast'
import {
  fetchBankUsdRate,
  fetchFinanceSettings,
  ratesKeys,
  updateFinanceSettings,
} from '@/modules/finance/api/rates'
import { Spinner, TextSkeleton } from '@/modules/finance/components/loading/Loading'
import { useFinanceT } from '@/modules/finance/i18n'
import { cleanNumber, grouped } from '@/modules/finance/lib/numberInput'
import s from './RateSettings.module.scss'

/**
 * Finance settings → the dollar rate: the Central Bank's for today, and the
 * user's own (their bank's), which a new dollar transaction then starts
 * with. Saved transactions keep the rate they were saved with.
 */
export function RateSettings() {
  const t = useFinanceT()
  const qc = useQueryClient()
  const today = todayYmd()

  const { data: bank, isLoading: bankLoading } = useQuery({
    queryKey: ratesKeys.bankUsd(today),
    queryFn: () => fetchBankUsdRate(today),
  })
  const { data: settings } = useQuery({ queryKey: ratesKeys.settings, queryFn: fetchFinanceSettings })
  const saved = settings?.usdRate ?? null
  // What is typed; null until then, so the saved one shows once it arrives.
  const [typed, setTyped] = useState<string | null>(null)
  const value = typed ?? (saved ? String(saved) : '')
  const [busy, setBusy] = useState(false)

  async function save(usdRate: number | null) {
    if (busy) return
    setBusy(true)
    try {
      // The answer goes straight into the cache, so the old value never flashes back.
      qc.setQueryData(ratesKeys.settings, await updateFinanceSettings({ usdRate }))
      setTyped(null)
      // Every prefill and the badge follow the new choice.
      await qc.invalidateQueries({ queryKey: ['finance', 'rate'] })
      toast(usdRate ? t.rate.saved : t.rate.cleared, 'success')
    } catch {
      toast(t.rate.failed, 'error')
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const n = Number(value)
    void save(n > 0 ? n : null)
  }

  return (
    <section className={s.card} aria-label={t.rate.title}>

      <div className={s.row}>
        <span className={s.label}>
          {bank?.source === 'cbu' ? t.rate.bank(formatShortDay(bank.date)) : bankLoading ? '' : t.rate.bankUnknown}
        </span>
        <span className={s.value}>
          {bankLoading ? <TextSkeleton width={96} /> : bank?.rate ? `${formatAmount(bank.rate)} so'm` : '–'}
          {!saved && bank?.rate && <span className={s.inUse}>{t.rate.using}</span>}
        </span>
      </div>

      <form className={s.own} onSubmit={onSubmit}>
        <div className={s.ownLabel}>
          <label htmlFor="own-rate">{t.rate.own}</label>
          {saved && <span className={s.inUse}>{t.rate.using}</span>}
        </div>
        <div className={s.ownRow}>
          <span className={s.unit}>1 USD =</span>
          <div className={s.inputWrap}>
            <input
              id="own-rate"
              className={s.input}
              inputMode="decimal"
              value={grouped(value)}
              placeholder={bank?.rate ? grouped(String(bank.rate)) : '0'}
              onChange={(e) => setTyped(cleanNumber(e.target.value, true, 7))}
            />
          </div>
          <span className={s.unit}>so'm</span>
        </div>
        <p className={s.hint}>{t.rate.ownHint}</p>
        <div className={s.actions}>
          {saved && (
            <button type="button" className={s.btnSecondary} disabled={busy} onClick={() => void save(null)}>
              {t.rate.useBank}
            </button>
          )}
          <button
            type="submit"
            className={s.btnPrimary}
            // Nothing new to save: untouched, or emptied with no own rate set.
            disabled={busy || typed === null || (!Number(typed) && !saved)}
            aria-busy={busy || undefined}
            aria-label={t.rate.saveLabel}
          >
            {busy && <Spinner />}
            {t.rate.save}
          </button>
        </div>
      </form>
    </section>
  )
}
