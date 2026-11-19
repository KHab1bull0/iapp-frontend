import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCategories } from '@/modules/finance/api/categories'
import { categoryParentsKey, fetchCategoryParents } from '@/modules/finance/api/categoryParents'
import { categoryTree } from '@/modules/finance/lib/categoryTree'
import { CategoryPicker } from './CategoryPicker'
import { createTransaction, updateTransaction, type Transaction } from '@/modules/finance/api/transactions'
import { rememberCategory } from '@/modules/finance/lib/recentCategories'
import { CURRENCY, todayYmd } from '@/core/lib/format'
import { DateField } from '@/core/components/ui/DateField'
import { SegmentedControl } from '@/core/components/ui/SegmentedControl'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { toast } from '@/core/components/ui/toast'
import { LoadingBlock, Spinner, TextSkeleton } from '@/modules/finance/components/loading/Loading'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionForm.module.scss'

/**
 * Add/edit a transaction, amount first: the number is what you came to
 * write down (phones open their number keyboard for it). Categories are
 * chips, the ones you use most recently first.
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

export function TransactionForm({ transaction, onSaved, onCancel, className }: Props) {
  const t = useFinanceT()
  const qc = useQueryClient()
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

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
  const { data: parents = [], isLoading: parentsLoading } = useQuery({
    queryKey: categoryParentsKey,
    queryFn: fetchCategoryParents,
  })
  const options = categoryTree(categories, parents, type)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
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
          // Money out, money in: the arrows banking apps use, and the colour
          // the amount below takes.
          { value: 'expense', label: t.expense, icon: ArrowUpRight, tone: 'danger' },
          { value: 'income', label: t.income, icon: ArrowDownLeft, tone: 'success' },
        ]}
      />

      <div className={clsx(s.amount, type === 'income' ? s.amtIn : s.amtOut)}>
        <input
          className={s.amountInput}
          inputMode="numeric"
          enterKeyHint="next"
          aria-label={t.tx.amount}
          value={grouped(amount)}
          placeholder="0"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_DIGITS)
            setAmount(digits)
            setError('')
          }}
        />
        <span className={s.amountSfx}>{CURRENCY}</span>
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>{t.category}</span>
        {categoriesLoading || parentsLoading ? (
          // Not "no categories" while they are still on their way.
          <LoadingBlock label={t.categories.loading} className={s.chips}>
            <CategoryChipsSkeleton />
          </LoadingBlock>
        ) : options.length === 0 ? (
          <p className={s.hint}>{t.tx.noCategories}</p>
        ) : (
          <CategoryPicker
            key={type}
            nodes={options}
            value={categoryId}
            onChange={(id) => {
              setCategoryId(id)
              setError('')
            }}
          />
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

      {error && (
        <div className={s.fieldErr} role="alert">
          {error}
        </div>
      )}

      <div data-form-actions>
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="submit" className={s.btnPrimary} disabled={loading} aria-busy={loading || undefined}>
          {loading && <Spinner />}
          {loading ? t.saving : isEdit ? t.tx.saveChanges : t.save}
        </button>
      </div>
    </form>
  )
}

const CHIP_WIDTHS = [96, 72, 112, 84, 64]

/** Category chips before the categories arrive: pills of a chip's height. */
function CategoryChipsSkeleton() {
  return CHIP_WIDTHS.map((w) => (
    <Skeleton key={w} width={w} height="var(--control-md)" radius="var(--radius-pill)" />
  ))
}

/**
 * The form while the transaction it edits loads: each field at its own
 * height, labels already in place. Cancel works; Save waits for the data.
 */
export function TransactionFormSkeleton({ onCancel }: { onCancel: () => void }) {
  const t = useFinanceT()
  return (
    <LoadingBlock label={t.tx.loadingOne} className={s.form}>
      <Skeleton height="var(--control-md)" radius="var(--radius-md)" />

      <div className={clsx(s.amount, s.amountSkeleton)}>
        <TextSkeleton width={180} />
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>{t.category}</span>
        <div className={s.chips} aria-hidden>
          <CategoryChipsSkeleton />
        </div>
      </div>

      <div className={s.formGrid}>
        <div className={s.field}>
          <span className={s.fieldLabel}>{t.tx.date}</span>
          <Skeleton height="var(--control-md)" radius="var(--radius-md)" />
        </div>
        <div className={s.field}>
          <span className={s.fieldLabel}>{t.tx.time}</span>
          <Skeleton height="var(--control-md)" radius="var(--radius-md)" />
        </div>
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>{t.tx.note}</span>
        <Skeleton height="var(--control-md)" radius="var(--radius-md)" />
      </div>

      <div data-form-actions>
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="button" className={s.btnPrimary} disabled>
          {t.tx.saveChanges}
        </button>
      </div>
    </LoadingBlock>
  )
}
