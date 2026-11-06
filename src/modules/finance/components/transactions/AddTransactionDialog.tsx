import { Sheet } from '@/core/components/ui/Sheet'
import type { Transaction } from '@/modules/finance/api/transactions'
import { useFinanceT } from '@/modules/finance/i18n'
import { TransactionForm } from './TransactionForm'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
}

/** Add/edit a transaction: a bottom sheet on phones, a dialog on desktop. */
export function AddTransactionDialog({ open, onOpenChange, transaction }: Props) {
  const t = useFinanceT()
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={transaction ? t.tx.editTitle : t.tx.addTitle}>
      <TransactionForm
        // Remount on open so a fresh sheet never shows the previous entry.
        key={`${transaction?.id ?? 'new'}-${String(open)}`}
        transaction={transaction}
        onSaved={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Sheet>
  )
}
