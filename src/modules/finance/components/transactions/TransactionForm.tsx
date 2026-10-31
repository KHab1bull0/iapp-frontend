import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import clsx from 'clsx'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { fetchCategories } from '@/modules/finance/api/categories'
import { createTransaction, updateTransaction, type Transaction } from '@/modules/finance/api/transactions'
import { CURRENCY } from '@/core/lib/format'
import { toast } from '@/core/components/ui/toast'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionForm.module.scss'

/**
 * The add/edit form itself, with no opinion about its container. Rendered
 * inside a Dialog on desktop and inside a route page on touch layouts.
 */

interface Props {
  transaction?: Transaction | null
  /** Called after a successful save. */
  onSaved: () => void
  /** Called when the user backs out. */
  onCancel: () => void
  /** Extra class on the <form>, e.g. to let the page variant fill its column. */
  className?: string
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function now() {
  return new Date().toTimeString().slice(0, 5)
}

function formatDisplay(raw: string): string {
  if (!raw) return ''
  const [int, dec] = raw.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return dec !== undefined ? `${grouped}.${dec}` : grouped
}

function handleAmountInput(
  e: ChangeEvent<HTMLInputElement>,
  setter: (v: string) => void,
) {
  const stripped = e.target.value.replace(/\s/g, '')
  if (/^\d*\.?\d*$/.test(stripped)) setter(stripped)
}

export function TransactionForm({ transaction, onSaved, onCancel, className }: Props) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const qc = useQueryClient()
  const isEdit = !!transaction

  const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [categoryId, setCategoryId] = useState(transaction?.category.id ?? '')
  const [date, setDate] = useState(transaction ? transaction.date.slice(0, 10) : today)
  const [time, setTime] = useState(
    transaction?.time ?? transaction?.createdAt?.slice(11, 16) ?? now,
  )
  const [note, setNote] = useState(transaction?.note ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const filtered = categories.filter((c) => c.type === type)

  // The dialog keeps this component mounted between openings, so re-sync when
  // it is handed a different transaction. The page variant remounts instead.
  useEffect(() => {
    if (!transaction) return
    setType(transaction.type)
    setAmount(String(transaction.amount))
    setCategoryId(transaction.category.id)
    setDate(transaction.date.slice(0, 10))
    setTime(transaction.time ?? transaction.createdAt?.slice(11, 16) ?? now())
    setNote(transaction.note ?? '')
    setError('')
    setTouched(false)
  }, [transaction])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError(t.tx.invalidAmount); return }
    if (!categoryId) { setError(t.tx.pickCategory); return }
    if (!date) { setError(t.tx.pickDate); return }

    setLoading(true)
    setError('')
    try {
      const payload = { amount: num, type, categoryId, date, time: time || undefined, note: note || undefined }
      if (isEdit && transaction) {
        await updateTransaction(transaction.id, payload)
      } else {
        await createTransaction(payload)
      }
      await qc.invalidateQueries({ queryKey: ['transactions'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      // The edit page caches the row under its own key; without this, reopening
      // it within the 60s staleTime showed the pre-edit values.
      if (isEdit && transaction) {
        await qc.invalidateQueries({ queryKey: ['transaction', transaction.id] })
      }
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
      {/* Type toggle */}
      <div className={s.typeToggle}>
        <button
          type="button"
          className={clsx(s.type, s.typeIn, type === 'income' && s.active)}
          onClick={() => { setType('income'); setCategoryId('') }}
        >
          <span className={s.typeIc}><TrendingUp size={18} /></span>
          <span className={s.typeTitle}>{t.income}</span>
          <span className={s.typeSub}>{t.tx.moneyIn}</span>
        </button>
        <button
          type="button"
          className={clsx(s.type, s.typeOut, type === 'expense' && s.active)}
          onClick={() => { setType('expense'); setCategoryId('') }}
        >
          <span className={s.typeIc}><TrendingDown size={18} /></span>
          <span className={s.typeTitle}>{t.expense}</span>
          <span className={s.typeSub}>{t.tx.moneyOut}</span>
        </button>
      </div>

      {/* Amount */}
      <div className={s.amountWrap}>
        <span className={s.amountLabel}>{t.tx.amount}</span>
        <div className={clsx(
          s.amount,
          type === 'income' ? s.amtIn : s.amtOut,
          touched && !amount && s.error,
        )}>
          <input
            inputMode="decimal"
            value={formatDisplay(amount)}
            onChange={(e) => handleAmountInput(e, setAmount)}
            className={s.amountInput}
            placeholder="0"
          />
          <span className={s.amountSfx}>{CURRENCY}</span>
        </div>
      </div>

      {/* Category */}
      <label className={s.field}>
        <span className={s.fieldLabel}>{t.category}</span>
        <div className={s.inputWrap} style={{ position: 'relative' }}>
          <select
            className={clsx(s.input, s.select)}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">{t.tx.selectCategory}</option>
            {filtered.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {catName(c.name)}</option>
            ))}
          </select>
          <span className={s.selectChev}><ChevronDown size={15} /></span>
        </div>
      </label>

      {/* Date + Time grid */}
      <div className={s.formGrid}>
        <label className={s.field}>
          <span className={s.fieldLabel}>{t.tx.date}</span>
          <div className={s.inputWrap}>
            <input
              className={s.input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </label>

        <label className={s.field}>
          <span className={s.fieldLabel}>{t.tx.time}</span>
          <div className={s.inputWrap}>
            <input
              className={s.input}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </label>
      </div>

      {/* Note */}
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

      {error && <div className={s.fieldErr} role="alert">{error}</div>}

      <div className={s.formActions}>
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
