import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { deleteCategory, type Category } from '@/modules/finance/api/categories'
import { toast } from '@/core/components/ui/toast'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog'
import { AddCategoryDialog } from './AddCategoryDialog'
import s from './CategoryList.module.scss'

function CategoryCard({ cat, onEdit }: { cat: Category; onEdit: (cat: Category) => void }) {
  const qc = useQueryClient()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteCategory(cat.id)
      await qc.invalidateQueries({ queryKey: ['categories'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(`"${cat.name}" deleted`, 'success')
    } catch {
      toast('Failed to delete category', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={s.catCard}>
      <span
        className={s.catEmoji}
        style={{ background: cat.color + '22', color: cat.color }}
      >
        {cat.icon}
      </span>
      <div className={s.catMeta}>
        {/* The raw hex code used to be printed here — developer detail, no value
            to the user. The emoji chip already carries the colour. */}
        <div className={s.catName}>{cat.name}</div>
        <div className={s.catType}>{cat.type === 'income' ? 'Income' : 'Expense'}</div>
      </div>
      <button className={s.catEdit} onClick={() => onEdit(cat)} aria-label="Edit">
        <Pencil size={14} />
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className={s.catDel} disabled={deleting} aria-label="Delete">
            <Trash2 size={14} />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category. Transactions linked to it will lose their
              category association.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface Props {
  categories: Category[]
  type: 'income' | 'expense'
}

export function CategoryList({ categories, type }: Props) {
  const filtered = categories.filter((c) => c.type === type)
  const [editing, setEditing] = useState<Category | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  function handleEdit(cat: Category) {
    setEditing(cat)
    setEditOpen(true)
  }

  if (filtered.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
        No {type} categories yet
      </div>
    )
  }

  return (
    <div className={s.catGrid}>
      {filtered.map((cat) => <CategoryCard key={cat.id} cat={cat} onEdit={handleEdit} />)}
      {editing && (
        <AddCategoryDialog
          key={editing.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          category={editing}
        />
      )}
    </div>
  )
}
