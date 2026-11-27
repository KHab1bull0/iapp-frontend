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
import { formatShortDay, todayYmd } from '@/core/lib/format'
import { cleanNumber, grouped } from '@/modules/finance/lib/numberInput'
import { fetchUsdRate, ratesKeys, type Currency } from '@/modules/finance/api/rates'
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

/** The amount column holds ten whole digits (numeric(12,2)). */
const MAX_DIGITS = 10

/** A saved number as the field shows it: dollars with their cents ("24.50"), so'm whole. */
function asTyped(n: number, cents: boolean): string {
  return cents && !Number.isInteger(n) ? n.toFixed(2) : String(Math.round(n))
}

/** A rate as the field shows it: "12002.1" → "12002.10". */
function rateText(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export function TransactionForm({ transaction, onSaved, onCancel, className }: Props) {
  const t = useFinanceT()
  const qc = useQueryClient()
  const isEdit = !!transaction

  const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense')
  const [currency, setCurrency] = useState<Currency>(transaction?.currency ?? 'UZS')
  const usd = currency === 'USD'
  const [amount, setAmount] = useState(transaction ? asTyped(transaction.amount, transaction.currency === 'USD') : '')
  // A dollar one's rate: the one it was saved with; a new one follows the
  // bank's (or the user's own) for the day until it is typed over.
  const [typedRate, setTypedRate] = useState<string | null>(transaction?.rate ? rateText(transaction.rate) : null)
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
  // Parents only group the chips: categories don't wait for them (nor break without them).
  const { data: parents = [] } = useQuery({
    queryKey: categoryParentsKey,
    queryFn: fetchCategoryParents,
  })
  const options = categoryTree(categories, parents, type)
  const { data: suggested } = useQuery({
    queryKey: ratesKeys.usd(date),
    queryFn: () => fetchUsdRate(date),
    enabled: usd && typedRate === null,
  })
  const rate = typedRate ?? (suggested?.rate ? rateText(suggested.rate) : '')
  const inSom = usd && Number(amount) && Number(rate) ? Math.round(Number(amount) * Number(rate)) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    const num = Number(amount)
    if (!num || num <= 0) return setError(t.tx.invalidAmount)
    if (!categoryId) return setError(t.tx.pickCategory)
    if (usd && !(Number(rate) > 0)) return setError(t.tx.rateMissing)

    setLoading(true)
    setError('')
    try {
      const payload = {
        amount: num,
        currency,
        ...(usd && { rate: Number(rate) }),
        type,
        categoryId,
        date,
        time: time || undefined,
        note: note || undefined,
      }
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
          // Dollars have cents: the keypad with a point.
          inputMode={usd ? 'decimal' : 'numeric'}
          enterKeyHint="next"
          aria-label={t.tx.amount}
          value={grouped(amount)}
          placeholder="0"
          onChange={(e) => {
            setAmount(cleanNumber(e.target.value, usd, MAX_DIGITS))
            setError('')
          }}
        />
      </div>

      <div className={s.currencies} role="group" aria-label={t.tx.currency}>
        {(['UZS', 'USD'] as const).map((c) => (
          <button
            key={c}
            type="button"
            className={clsx(s.currency, currency === c && s.currencyOn)}
            aria-pressed={currency === c}
            onClick={() => {
              setCurrency(c)
              // So'm is whole: the cents go.
              if (c === 'UZS') setAmount((a) => a.split('.')[0])
              setError('')
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {usd && (
        <div className={s.field}>
          <span className={s.fieldLabel}>{t.tx.rate}</span>
          <div className={s.rateRow}>
            <span className={s.rateUnit}>1 USD =</span>
            <div className={clsx(s.inputWrap, s.rateWrap)}>
              <input
                className={s.input}
                inputMode="decimal"
                aria-label={t.tx.rateLabel}
                value={grouped(rate)}
                placeholder="0"
                onChange={(e) => {
                  setTypedRate(cleanNumber(e.target.value, true, 7))
                  setError('')
                }}
              />
            </div>
            <span className={s.rateUnit}>so'm</span>
          </div>
          <p className={s.hint}>
            {typedRate === null && suggested?.source === 'cbu' && t.tx.rateFromBank(formatShortDay(suggested.date))}
            {typedRate === null && suggested?.source === 'manual' && t.tx.rateOwn}
            {typedRate === null && suggested && suggested.rate === null && t.tx.rateUnknown}
            {inSom !== null && <span className={s.inSom}>{t.tx.inSom(grouped(String(inSom)))}</span>}
          </p>
        </div>
      )}

      <div className={s.field}>
        <span className={s.fieldLabel}>{t.category}</span>
        {categoriesLoading ? (
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
