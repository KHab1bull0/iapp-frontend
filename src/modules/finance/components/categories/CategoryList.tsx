import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { deleteCategory, type Category } from '@/modules/finance/api/categories'
import { toast } from '@/core/components/ui/toast'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { AddCategoryDialog } from './AddCategoryDialog'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './CategoryList.module.scss'
import { EmptyState } from '@/core/components/ui/EmptyState'

function CategoryCard({ cat, onEdit }: { cat: Category; onEdit: (cat: Category) => void }) {
  const qc = useQueryClient()
  const t = useFinanceT()
  const catName = useCategoryName()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteCategory(cat.id)
      await qc.invalidateQueries({ queryKey: ['categories'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(t.categories.deleted(catName(cat.name)), 'success')
    } catch {
      toast(t.categories.deleteFailed, 'error')
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
        <div className={s.catName}>{catName(cat.name)}</div>
        <div className={s.catType}>{t[cat.type]}</div>
      </div>
      <button className={s.catEdit} onClick={() => onEdit(cat)} aria-label={t.edit}>
        <Pencil size={14} />
      </button>
      <ConfirmDialog
        trigger={
          <button className={s.catDel} disabled={deleting} aria-label={t.delete}>
            <Trash2 size={14} />
          </button>
        }
        title={t.categories.deleteTitle(catName(cat.name))}
        description={t.categories.deleteDesc}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={handleDelete}
      />
    </div>
  )
}

interface Props {
  categories: Category[]
  type: 'income' | 'expense'
}

export function CategoryList({ categories, type }: Props) {
  const t = useFinanceT()
  const filtered = categories.filter((c) => c.type === type)
  const [editing, setEditing] = useState<Category | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  function handleEdit(cat: Category) {
    setEditing(cat)
    setEditOpen(true)
  }

  if (filtered.length === 0) {
    return (
      <EmptyState compact title={t.categories.empty(t[type].toLowerCase())} />
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
