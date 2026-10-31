import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import {
  createCategory,
  deleteCategory,
  englishKeys,
  fetchCategories,
  updateCategory,
  type Category,
} from '@/modules/english/api/english'
import { ConfirmDelete } from './ConfirmDelete'
import { EnglishSettingsSubpage } from './EnglishSettingsSubpage'
import { apiMessage as message } from './errors'
import s from '../EnglishPages.module.scss'
import e from './EnglishSettings.module.scss'

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function CategoryRow({ category }: { category: Category }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const refresh = () => qc.invalidateQueries({ queryKey: englishKeys.all })

  const save = useMutation({
    mutationFn: () => updateCategory(category.id, { name: name.trim() }),
    onSuccess: async () => {
      setEditing(false)
      await refresh()
    },
    onError: (err) => toast(message(err, 'Could not save the category'), 'error'),
  })
  const remove = useMutation({
    mutationFn: () => deleteCategory(category.id),
    onSuccess: refresh,
    onError: () => toast('Could not delete the category', 'error'),
  })

  if (editing) {
    return (
      <form
        className={e.row}
        onSubmit={(ev) => {
          ev.preventDefault()
          if (name.trim()) save.mutate()
        }}
      >
        <input className={e.input} value={name} onChange={(ev) => setName(ev.target.value)} maxLength={50} aria-label={`Name of ${category.name}`} />
        <button type="submit" className={e.btnPrimary} disabled={save.isPending}>Save</button>
        <button
          type="button"
          className={e.btnGhost}
          onClick={() => {
            setName(category.name)
            setEditing(false)
          }}
        >
          Cancel
        </button>
      </form>
    )
  }

  return (
    <div className={e.row}>
      <span className={e.name}>{category.name}</span>
      <span className={e.sub}>Added {dateFmt.format(new Date(category.createdAt))}</span>
      <button className={e.iconBtn} onClick={() => setEditing(true)} aria-label={`Edit ${category.name}`}>
        <Pencil size={14} />
      </button>
      <ConfirmDelete
        label={category.name}
        description="Its words stay, without a category."
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}

/** English settings → Categories: optional groups for words. */
export function CategoriesPage() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: englishKeys.all })
  const { data: categories = [] } = useQuery({ queryKey: englishKeys.categories, queryFn: fetchCategories })
  const [categoryName, setCategoryName] = useState('')

  const addCategory = useMutation({
    mutationFn: () => createCategory({ name: categoryName.trim() }),
    onSuccess: async () => {
      setCategoryName('')
      await refresh()
    },
    onError: (err) => toast(message(err, 'Could not add the category'), 'error'),
  })

  return (
    <EnglishSettingsSubpage title="Categories" description="Optional groups for your words">
      <section className={s.section} aria-label="Categories">
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Categories</h2>
        </div>
        <div className={s.list}>
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
          <form
            className={e.addRow}
            onSubmit={(ev: FormEvent) => {
              ev.preventDefault()
              if (categoryName.trim()) addCategory.mutate()
            }}
          >
            <input className={e.input} placeholder="New category" value={categoryName} onChange={(ev) => setCategoryName(ev.target.value)} maxLength={50} aria-label="Category name" />
            <button type="submit" className={e.btnPrimary} disabled={!categoryName.trim() || addCategory.isPending}>
              Add category
            </button>
          </form>
        </div>
      </section>
    </EnglishSettingsSubpage>
  )
}
