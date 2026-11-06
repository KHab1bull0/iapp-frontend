import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Delete } from 'lucide-react'
import { fetchCategories } from '@/modules/finance/api/categories'
import { createTransaction, updateTransaction, type Transaction } from '@/modules/finance/api/transactions'
import { byRecent, rememberCategory } from '@/modules/finance/lib/recentCategories'
import { CURRENCY, todayYmd } from '@/core/lib/format'
import { DateField } from '@/core/components/ui/DateField'
import { SegmentedControl } from '@/core/components/ui/SegmentedControl'
import { toast } from '@/core/components/ui/toast'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionForm.module.scss'

/**
 * Add/edit a transaction, amount first: the number is what you came to
 * write down. Phones get a keypad of their own (no keyboard sliding over the
 * form); categories are chips, the ones you use most recently first.
 */

interface Props {
  transaction?: Transaction | null
  /** Called after a successful save. */
  onSaved: () => void
  /** Called when the user backs out. */
  onCancel: () => void
  className?: string
}

/** The device's local time as HH:MM. */
function now() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "1234567" → "1 234 567". So'm has no sub-unit, so amounts are whole. */
function grouped(raw: string): string {
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const MAX_DIGITS = 12
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'back'] as const

export function TransactionForm({ transaction, onSaved, onCancel, className }: Props) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const qc = useQueryClient()
  const isMobile = useIsMobile()
  const isEdit = !!transaction

  const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? String(Math.round(transaction.amount)) : '')
  const [categoryId, setCategoryId] = useState(transaction?.category.id ?? '')
  // Local calendar day: toISOString() is UTC, a day behind before 5am here.
  const [date, setDate] = useState(transaction ? transaction.date.slice(0, 10) : todayYmd())
  const [time, setTime] = useState(transaction?.time ?? transaction?.createdAt?.slice(11, 16) ?? now())
  const [note, setNote] = useState(transaction?.note ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const options = byRecent(categories.filter((c) => c.type === type))

  const press = (key: (typeof KEYS)[number]) => {
    setError('')
    if (key === 'back') return setAmount((a) => a.slice(0, -1))
    setAmount((a) => {
      const next = (a + key).replace(/^0+/, '')
      return next.length > MAX_DIGITS ? a : next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const num = Number(amount)
    if (!num || num <= 0) return setError(t.tx.invalidAmount)
    if (!categoryId) return setError(t.tx.pickCategory)

    setLoading(true)
    setError('')
    try {
      const payload = { amount: num, type, categoryId, date, time: time || undefined, note: note || undefined }
      if (isEdit && transaction) await updateTransaction(transaction.id, payload)
      else await createTransaction(payload)
      rememberCategory(categoryId)
      await qc.invalidateQueries({ queryKey: ['transactions'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      if (isEdit && transaction) await qc.invalidateQueries({ queryKey: ['transaction', transaction.id] })
      toast(isEdit ? t.tx.updated : t.tx.added, 'success')
      onSaved()
    } catch {
      setError(isEdit ? t.tx.updateFailed : t.tx.addFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={clsx(s.form, className)}>
      <SegmentedControl
        stretch
        label={t.tx.type}
        value={type}
        onChange={(v) => {
          setType(v)
          setCategoryId('')
        }}
        options={[
          { value: 'expense', label: t.expense },
          { value: 'income', label: t.income },
        ]}
      />

      <div className={clsx(s.amount, type === 'income' ? s.amtIn : s.amtOut)}>
        {isMobile ? (
          <output className={s.amountValue} aria-label={t.tx.amount} aria-live="polite">
            {type === 'income' ? '+' : '−'}
            {grouped(amount) || '0'}
          </output>
        ) : (
          <input
            className={s.amountInput}
            inputMode="numeric"
            aria-label={t.tx.amount}
            value={grouped(amount)}
            placeholder="0"
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_DIGITS)
              setAmount(digits)
              setError('')
            }}
          />
        )}
        <span className={s.amountSfx}>{CURRENCY}</span>
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>{t.category}</span>
        {options.length === 0 ? (
          <p className={s.hint}>{t.tx.noCategories}</p>
        ) : (
          <div className={s.chips} role="radiogroup" aria-label={t.category}>
            {options.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={categoryId === c.id}
                className={clsx(s.chip, categoryId === c.id && s.chipOn)}
                style={categoryId === c.id ? { borderColor: c.color, background: `${c.color}1f` } : undefined}
                onClick={() => {
                  setCategoryId(c.id)
                  setError('')
                }}
              >
                <span aria-hidden>{c.icon}</span>
                {catName(c.name)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={s.formGrid}>
        <div className={s.field}>
          <span className={s.fieldLabel}>{t.tx.date}</span>
          <DateField label={t.tx.date} value={date} onChange={(d) => d && setDate(d)} max={todayYmd()} />
        </div>
        <label className={s.field}>
          <span className={s.fieldLabel}>{t.tx.time}</span>
          <div className={s.inputWrap}>
            <input className={s.input} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </label>
      </div>

      <label className={s.field}>
        <span className={s.fieldLabel}>{t.tx.note}</span>
        <div className={s.inputWrap}>
          <input
            className={s.input}
            placeholder={t.tx.notePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
        </div>
      </label>

      {isMobile && (
        <div className={s.keypad}>
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={s.key}
              onClick={() => press(k)}
              aria-label={k === 'back' ? t.tx.backspace : k}
            >
              {k === 'back' ? <Delete size={22} /> : k}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className={s.fieldErr} role="alert">
          {error}
        </div>
      )}

      <div className={s.formActions} data-sheet-actions>
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="submit" className={s.btnPrimary} disabled={loading}>
          {loading ? t.saving : isEdit ? t.tx.saveChanges : t.save}
        </button>
      </div>
    </form>
  )
}
