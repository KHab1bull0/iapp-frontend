import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
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
import s from './RateSettings.module.scss'

/** "12300.5" → "12 300.5". */
function grouped(raw: string): string {
  const [whole, cents] = raw.split('.')
  const g = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return cents === undefined ? g : `${g}.${cents}`
}

/** Digits and at most one "." (a "," counts) with two after it. */
function clean(typed: string): string {
  const [whole = '', ...rest] = typed.replace(',', '.').split('.')
  const w = whole.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9)
  return rest.length ? `${w || '0'}.${rest.join('').replace(/\D/g, '').slice(0, 2)}` : w
}

/**
 * Finance settings → the dollar rate: the Central Bank's for today, and the
 * user's own (their bank's), which a new dollar transaction then starts
 * with. Saved transactions keep the rate they were saved with.
 */
export function RateSettings() {
  const t = useFinanceT()
  const qc = useQueryClient()
  const today = todayYmd()
  const { hash } = useLocation()
  const ref = useRef<HTMLElement>(null)

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

  // Opened from the rate badge: bring this section into view.
  useEffect(() => {
    if (hash === '#rate') ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [hash])

  async function save(usdRate: number | null) {
    if (busy) return
    setBusy(true)
    try {
      await updateFinanceSettings({ usdRate })
      setTyped(null)
      await qc.invalidateQueries({ queryKey: ratesKeys.settings })
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
    <section id="rate" ref={ref} className={s.card} aria-labelledby="rate-title">
      <div>
        <h2 id="rate-title" className={s.title}>
          {t.rate.title}
        </h2>
        <p className={s.sub}>{t.rate.sub}</p>
      </div>

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
              onChange={(e) => setTyped(clean(e.target.value))}
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
            disabled={busy || typed === null}
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
