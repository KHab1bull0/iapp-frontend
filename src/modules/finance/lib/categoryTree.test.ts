import { describe, expect, test } from 'vitest'
import type { Category } from '@/modules/finance/api/categories'
import type { CategoryParent } from '@/modules/finance/api/categoryParents'
import { categoryTree, parentOf, type TreeNode } from './categoryTree'

const cat = (id: string, parentId: string | null = null, type: Category['type'] = 'expense'): Category => ({
  id, name: id, type, color: '#000000', icon: '•', parentId,
})
const parent = (id: string, type: CategoryParent['type'] = 'expense'): CategoryParent => ({
  id, name: id, type, color: '#000000', icon: '•', createdAt: '',
})
const ids = (nodes: TreeNode[]) =>
  nodes.map((n) => (n.kind === 'parent' ? `${n.parent.id}[${n.children.map((c) => c.id).join(',')}]` : n.category.id))

const parents = [parent('home'), parent('daily'), parent('empty'), parent('work', 'income')]
const categories = [
  cat('food', 'daily'),
  cat('gas', 'home'),
  cat('power', 'home'),
  cat('fun'),
  cat('gift'),
  cat('salary', 'work', 'income'),
  cat('lost', 'deleted-parent'),
]

describe('categoryTree', () => {
  test('puts categories under their parent and leaves the rest as they are', () => {
    expect(ids(categoryTree(categories, parents, 'expense', []))).toEqual([
      'home[gas,power]', 'daily[food]', 'fun', 'gift', 'lost',
    ])
  })

  test('leaves out a parent with no categories, and the other type', () => {
    const tree = ids(categoryTree(categories, parents, 'income', []))
    expect(tree).toEqual(['work[salary]'])
  })

  test("a parent ranks by its categories' recent use, and so do they inside it", () => {
    expect(ids(categoryTree(categories, parents, 'expense', ['fun', 'power']))).toEqual([
      'fun', 'home[power,gas]', 'daily[food]', 'gift', 'lost',
    ])
  })

  test('a category whose parent is unknown counts as unassigned', () => {
    expect(categoryTree(categories, parents, 'expense', []).some((n) => n.kind === 'category' && n.category.id === 'lost')).toBe(true)
  })
})

describe('parentOf', () => {
  test("a category's parent id, or null", () => {
    expect(parentOf('gas', categories)).toBe('home')
    expect(parentOf('fun', categories)).toBeNull()
    expect(parentOf('nope', categories)).toBeNull()
  })
})
