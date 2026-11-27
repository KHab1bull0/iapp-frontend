import type { Category } from '@/modules/finance/api/categories'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import { useFinanceT } from '@/modules/finance/i18n'
import { CategoryForm } from './CategoryForm'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
  /** A new one's type to start with. */
  type?: 'income' | 'expense'
}

/** Add/edit a category on desktop; phones get CategoryFormPage. */
export function AddCategoryDialog({ open, onOpenChange, category, type }: Props) {
  const t = useFinanceT()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? t.categories.editTitle : t.categories.addTitle}</DialogTitle>
        </DialogHeader>
        {/* Remount on open so a fresh dialog starts from the category (or blank). */}
        <CategoryForm
          key={`${category?.id ?? 'new'}-${String(open)}`}
          compact
          category={category}
          initialType={type}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
