import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fetchReviews, fetchWeek, reviewKeys, saveWeek } from './reviews'
import { tasksKeys } from './tasks'

const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('@/core/api/axios', () => ({ default: http }))

describe('reviews API', () => {
  beforeEach(() => {
    http.get.mockReset().mockResolvedValue({ data: 'body' })
    http.put.mockReset().mockResolvedValue({ data: 'saved' })
  })

  test('fetchWeek asks for the week with the device’s today', async () => {
    expect(await fetchWeek('2026-11-09', '2026-11-14')).toBe('body')
    expect(http.get).toHaveBeenCalledWith('/reviews/week', { params: { today: '2026-11-14', weekStart: '2026-11-09' } })
  })

  test('saveWeek PUTs the answers with their week', async () => {
    const input = { weekStart: '2026-11-09', wentWell: 'Gym', wentBadly: null, change: 'Sleep' }
    expect(await saveWeek(input)).toBe('saved')
    expect(http.put).toHaveBeenCalledWith('/reviews/week', input)
  })

  test('fetchReviews lists the past weeks', async () => {
    await fetchReviews()
    expect(http.get).toHaveBeenCalledWith('/reviews')
  })

  test("every key sits under the tasks' key, so a task change refreshes the review too", () => {
    for (const key of [reviewKeys.all, reviewKeys.list, reviewKeys.week('2026-11-09', '2026-11-14')]) {
      expect(key.slice(0, 2)).toEqual([...tasksKeys.all, 'review'])
    }
  })
})
