import { useState } from 'react'
import clsx from 'clsx'
import { Pencil, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { deleteCategory, type Category } from '@/modules/finance/api/categories'
import { deleteCategoryParent, type CategoryParent } from '@/modules/finance/api/categoryParents'
import { ParentDialog } from './ParentDialog'
import { refreshCategories } from './refresh'
import { toast } from '@/core/components/ui/toast'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { AddCategoryDialog } from './AddCategoryDialog'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import { Spinner } from '@/modules/finance/components/loading/Loading'
import s from './CategoryList.module.scss'
import { EmptyState } from '@/core/components/ui/EmptyState'

function CategoryCard({ cat, onEdit }: { cat: Category; onEdit: (cat: Category) => void }) {
  const qc = useQueryClient()
  const t = useFinanceT()
  const catName = useCategoryName()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteCategory(cat.id)
      await refreshCategories(qc)
      toast(t.categories.deleted(catName(cat.name)), 'success')
    } catch {
      toast(t.categories.deleteFailed, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={clsx(s.catCard, deleting && s.deleting)} aria-busy={deleting || undefined}>
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
      <button className={s.catEdit} onClick={() => onEdit(cat)} disabled={deleting} aria-label={t.edit}>
        <Pencil size={14} />
      </button>
      <ConfirmDialog
        trigger={
          <button className={s.catDel} disabled={deleting} aria-label={deleting ? t.deleting : t.delete}>
            {deleting ? <Spinner size={14} /> : <Trash2 size={14} />}
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

/** A parent's own row: its tile, name and count, edit and delete. */
function ParentRow({ parent, count, onEdit }: { parent: CategoryParent; count: number; onEdit: () => void }) {
  const qc = useQueryClient()
  const t = useFinanceT()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteCategoryParent(parent.id)
      await refreshCategories(qc)
      toast(t.categories.parentDeleted(parent.name), 'success')
    } catch {
      toast(t.categories.parentDeleteFailed, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={clsx(s.catCard, s.parentRow, deleting && s.deleting)} aria-busy={deleting || undefined}>
      <span className={s.catEmoji} style={{ background: parent.color + '22', color: parent.color }}>
        {parent.icon}
      </span>
      <div className={s.catMeta}>
        <div className={s.catName}>{parent.name}</div>
        <div className={s.catType}>{t.categories.parentCount(count)}</div>
      </div>
      <button className={s.catEdit} onClick={onEdit} disabled={deleting} aria-label={t.categories.editParent(parent.name)}>
        <Pencil size={14} />
      </button>
      <ConfirmDialog
        trigger={
          <button className={s.catDel} disabled={deleting} aria-label={deleting ? t.deleting : t.categories.deleteParent(parent.name)}>
            {deleting ? <Spinner size={14} /> : <Trash2 size={14} />}
          </button>
        }
        title={t.categories.parentDeleteTitle(parent.name)}
        description={t.categories.parentDeleteDesc}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={handleDelete}
      />
    </div>
  )
}

interface Props {
  categories: Category[]
  parents: CategoryParent[]
  type: 'income' | 'expense'
}

/**
 * One type's categories: each parent with its categories under it, then the
 * unassigned ones. Without parents, the plain list as before.
 */
export function CategoryList({ categories, parents, type }: Props) {
  const t = useFinanceT()
  const filtered = categories.filter((c) => c.type === type)
  const ofType = parents.filter((p) => p.type === type)
  const known = new Set(ofType.map((p) => p.id))
  const loose = filtered.filter((c) => !c.parentId || !known.has(c.parentId))
  const [editing, setEditing] = useState<Category | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editingParent, setEditingParent] = useState<CategoryParent | null>(null)
  const [parentOpen, setParentOpen] = useState(false)

  function handleEdit(cat: Category) {
    setEditing(cat)
    setEditOpen(true)
  }

  if (filtered.length === 0 && ofType.length === 0) {
    return (
      <EmptyState compact title={t.categories.empty(t[type].toLowerCase())} />
    )
  }

  const cards = (list: Category[]) => list.map((cat) => <CategoryCard key={cat.id} cat={cat} onEdit={handleEdit} />)

  return (
    <div className={s.catGrid}>
      {ofType.map((p) => {
        const children = filtered.filter((c) => c.parentId === p.id)
        return (
          <div key={p.id} role="group" aria-label={p.name} className={s.parentGroup}>
            <ParentRow
              parent={p}
              count={children.length}
              onEdit={() => {
                setEditingParent(p)
                setParentOpen(true)
              }}
            />
            {children.length > 0 && <div className={s.children}>{cards(children)}</div>}
          </div>
        )
      })}
      {ofType.length > 0 ? (
        loose.length > 0 && (
          <div role="group" aria-label={t.categories.unassigned} className={s.parentGroup}>
            <div className={s.looseHead}>{t.categories.unassigned}</div>
            {cards(loose)}
          </div>
        )
      ) : (
        cards(loose)
      )}
      {editing && (
        <AddCategoryDialog
          key={editing.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          category={editing}
        />
      )}
      {editingParent && (
        <ParentDialog
          key={editingParent.id}
          open={parentOpen}
          onOpenChange={setParentOpen}
          type={type}
          categories={categories}
          parent={editingParent}
        />
      )}
    </div>
  )
}
