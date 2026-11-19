import { useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TreeNode } from '@/modules/finance/lib/categoryTree'
import type { Category } from '@/modules/finance/api/categories'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionForm.module.scss'

interface Props {
  nodes: TreeNode[]
  value: string
  onChange: (categoryId: string) => void
}

/**
 * The category chips. A parent opens to its categories in place of the row
 * (tap it again for the row back); a parent is never the value itself.
 */
export function CategoryPicker({ nodes, value, onChange }: Props) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const holding = (n: TreeNode) => n.kind === 'parent' && n.children.some((c) => c.id === value)
  // Until the user opens or closes one, the parent holding the value is open
  // (editing a transaction on a parent's category; categories may come later).
  const [picked, setOpen] = useState<string | null | undefined>(undefined)
  const auto = nodes.find(holding)
  const open = picked !== undefined ? picked : auto?.kind === 'parent' ? auto.parent.id : null
  const opened = nodes.find((n) => n.kind === 'parent' && n.parent.id === open)

  const chip = (c: Category) => (
    <button
      key={c.id}
      type="button"
      role="radio"
      aria-checked={value === c.id}
      className={clsx(s.chip, value === c.id && s.chipOn)}
      style={value === c.id ? { borderColor: c.color, background: `${c.color}1f` } : undefined}
      onClick={() => onChange(c.id)}
    >
      <span aria-hidden>{c.icon}</span>
      {catName(c.name)}
    </button>
  )

  const parentChip = (n: Extract<TreeNode, { kind: 'parent' }>, isOpen: boolean) => {
    const chosen = n.children.find((c) => c.id === value)
    return (
      <button
        key={n.parent.id}
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? t.tx.closeParent(n.parent.name) : t.tx.openParent(n.parent.name)}
        className={clsx(s.chip, s.parentChip, (isOpen || chosen) && s.chipOn)}
        style={chosen || isOpen ? { borderColor: n.parent.color, background: `${n.parent.color}1f` } : undefined}
        onClick={() => setOpen(isOpen ? null : n.parent.id)}
      >
        {isOpen && <ChevronLeft size={14} aria-hidden />}
        <span aria-hidden>{n.parent.icon}</span>
        {n.parent.name}
        {!isOpen && chosen && <span className={s.parentPick}>· {catName(chosen.name)}</span>}
        {!isOpen && <ChevronRight size={14} aria-hidden />}
      </button>
    )
  }

  return (
    <div className={s.chips} role="radiogroup" aria-label={t.category}>
      {opened?.kind === 'parent'
        ? [parentChip(opened, true), ...opened.children.map(chip)]
        : nodes.map((n) => (n.kind === 'parent' ? parentChip(n, false) : chip(n.category)))}
    </div>
  )
}
