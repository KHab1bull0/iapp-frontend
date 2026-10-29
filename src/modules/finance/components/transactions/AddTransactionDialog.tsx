import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import type { Transaction } from '@/modules/finance/api/transactions'
import { TransactionForm } from './TransactionForm'

/**
 * Desktop container for TransactionForm. Touch layouts route to
 * TransactionFormPage instead — see useIsMobile at the call sites.
 */

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
}

export function AddTransactionDialog({ open, onOpenChange, transaction }: Props) {
  const isEdit = !!transaction

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>

        <TransactionForm
          // Remount on open so a fresh dialog never shows the previous entry.
          key={`${transaction?.id ?? 'new'}-${String(open)}`}
          transaction={transaction}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
