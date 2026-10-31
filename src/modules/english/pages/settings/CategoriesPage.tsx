import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { formatDate } from '@/core/lib/format'
import {
  createCategory,
  deleteCategory,
  englishKeys,
  fetchCategories,
  updateCategory,
  type Category,
} from '@/modules/english/api/english'
import { useEnglishT } from '@/modules/english/i18n'
import { ConfirmDelete } from './ConfirmDelete'
import { EnglishSettingsSubpage } from './EnglishSettingsSubpage'
import s from '../EnglishPages.module.scss'
import e from './EnglishSettings.module.scss'

function CategoryRow({ category }: { category: Category }) {
  const qc = useQueryClient()
  const { lang } = useLang()
  const t = useEnglishT()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const refresh = () => qc.invalidateQueries({ queryKey: englishKeys.all })

  const save = useMutation({
    mutationFn: () => updateCategory(category.id, { name: name.trim() }),
    onSuccess: async () => {
      setEditing(false)
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.categorySaveFailed), 'error'),
  })
  const remove = useMutation({
    mutationFn: () => deleteCategory(category.id),
    onSuccess: refresh,
    onError: (err) => toast(apiErrorText(err, lang, t.settings.categoryDeleteFailed), 'error'),
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
        <input className={e.input} value={name} onChange={(ev) => setName(ev.target.value)} maxLength={50} aria-label={t.settings.nameOf(category.name)} />
        <button type="submit" className={e.btnPrimary} disabled={save.isPending}>{t.save}</button>
        <button
          type="button"
          className={e.btnGhost}
          onClick={() => {
            setName(category.name)
            setEditing(false)
          }}
        >
          {t.cancel}
        </button>
      </form>
    )
  }

  return (
    <div className={e.row}>
      <span className={e.name}>{category.name}</span>
      <span className={e.sub}>{t.settings.added(formatDate(new Date(category.createdAt)))}</span>
      <button className={e.iconBtn} onClick={() => setEditing(true)} aria-label={t.edit(category.name)}>
        <Pencil size={14} />
      </button>
      <ConfirmDelete
        label={category.name}
        description={t.settings.categoryDeleteDesc}
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}

/** English settings → Categories: optional groups for words. */
export function CategoriesPage() {
  const qc = useQueryClient()
  const { lang } = useLang()
  const t = useEnglishT()
  const refresh = () => qc.invalidateQueries({ queryKey: englishKeys.all })
  const { data: categories = [] } = useQuery({ queryKey: englishKeys.categories, queryFn: fetchCategories })
  const [categoryName, setCategoryName] = useState('')

  const addCategory = useMutation({
    mutationFn: () => createCategory({ name: categoryName.trim() }),
    onSuccess: async () => {
      setCategoryName('')
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.categoryAddFailed), 'error'),
  })

  return (
    <EnglishSettingsSubpage title={t.settings.categories} description={t.settings.categoriesDesc}>
      <section className={s.section} aria-label={t.settings.categories}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{t.settings.categories}</h2>
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
            <input className={e.input} placeholder={t.settings.newCategory} value={categoryName} onChange={(ev) => setCategoryName(ev.target.value)} maxLength={50} aria-label={t.settings.categoryName} />
            <button type="submit" className={e.btnPrimary} disabled={!categoryName.trim() || addCategory.isPending}>
              {t.settings.addCategory}
            </button>
          </form>
        </div>
      </section>
    </EnglishSettingsSubpage>
  )
}
