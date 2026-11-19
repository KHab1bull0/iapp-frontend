import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createGroup, deleteGroup, fetchGroups, updateGroup } from './groups'
import { tasksKeys } from './tasks'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('@/core/api/axios', () => ({ default: http }))

describe('task groups API', () => {
  beforeEach(() => {
    for (const fn of Object.values(http)) fn.mockReset().mockResolvedValue({ data: 'body' })
  })

  test('lists, creates, updates and deletes under /tasks/groups', async () => {
    expect(await fetchGroups()).toBe('body')
    expect(http.get).toHaveBeenCalledWith('/tasks/groups')
    expect(await createGroup('Work', '#93c5fd')).toBe('body')
    expect(http.post).toHaveBeenCalledWith('/tasks/groups', { name: 'Work', color: '#93c5fd' })
    expect(await updateGroup('g1', 'Home', null)).toBe('body')
    expect(http.patch).toHaveBeenCalledWith('/tasks/groups/g1', { name: 'Home', color: null })
    await deleteGroup('g1')
    expect(http.delete).toHaveBeenCalledWith('/tasks/groups/g1')
  })

  test("the groups' key sits under the tasks' key, so deleting one refreshes the tasks too", () => {
    expect(tasksKeys.groups.slice(0, 1)).toEqual([...tasksKeys.all])
  })
})
