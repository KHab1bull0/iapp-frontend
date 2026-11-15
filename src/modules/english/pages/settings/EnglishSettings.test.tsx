import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NEW, L3, group, tag } from '@/modules/english/test-data'
import { loadingRegion, pending } from '@/modules/english/test-loading'
import { EnglishSettingsLayout } from './EnglishSettingsLayout'
import { EnglishSettingsIndex } from './EnglishSettingsIndex'
import { LevelsPage } from './LevelsPage'
import { TagsPage } from './TagsPage'

const api = vi.hoisted(() => ({
  fetchLevels: vi.fn(),
  fetchEnglishSettings: vi.fn(),
  updateEnglishSettings: vi.fn(),
  createLevel: vi.fn(),
  updateLevel: vi.fn(),
  deleteLevel: vi.fn(),
  fetchTags: vi.fn(),
  fetchGroups: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
}))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/english/settings" element={<EnglishSettingsLayout />}>
            <Route index element={<EnglishSettingsIndex />} />
            <Route path="levels" element={<LevelsPage />} />
            <Route path="tags" element={<TagsPage />} />
          </Route>
          <Route path="*" element={<p>elsewhere</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('English settings', () => {
  beforeEach(() => {
    api.fetchLevels.mockResolvedValue([NEW, L3])
    api.fetchEnglishSettings.mockResolvedValue({ newPerDay: 20 })
    api.fetchTags.mockResolvedValue([tag('t1', 'travel', { count: 4 }), tag('t2', 'noun', { groupId: 'g1', count: 7 })])
    api.fetchGroups.mockResolvedValue([group('g1', 'Parts of speech')])
    api.createLevel.mockResolvedValue(L3)
    api.createTag.mockResolvedValue(tag('t3', 'food'))
    api.createGroup.mockResolvedValue(group('g2', 'Topics'))
  })

  test('the levels page shows only levels', async () => {
    renderAt('/english/settings/levels')
    expect(await screen.findByRole('region', { name: 'Levels' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Parts of speech' })).toBeNull()
  })

  test('the tags page shows only tags', async () => {
    renderAt('/english/settings/tags')
    expect(await screen.findByRole('region', { name: 'Parts of speech' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Levels' })).toBeNull()
  })

  test('the section list links to Levels and Tags', async () => {
    renderAt('/english/settings/levels')
    const nav = screen.getByRole('navigation', { name: 'English settings sections' })
    expect(within(nav).getByRole('link', { name: /Levels/ }).getAttribute('href')).toBe('/english/settings/levels')
    expect(within(nav).getByRole('link', { name: /Tags/ }).getAttribute('href')).toBe('/english/settings/tags')
  })

  test('lists levels with their days; New cannot be deleted', async () => {
    renderAt('/english/settings/levels')
    const levels = await screen.findByRole('region', { name: 'Levels' })
    expect(await within(levels).findByText('New')).toBeTruthy()
    expect(within(levels).getByText('3 days')).toBeTruthy()
    expect(within(levels).queryByRole('button', { name: 'Delete New' })).toBeNull()
    expect(within(levels).getByRole('button', { name: 'Delete Three days' })).toBeTruthy()
  })

  test('adds a level with a name and an interval', async () => {
    renderAt('/english/settings/levels')
    const levels = await screen.findByRole('region', { name: 'Levels' })
    fireEvent.change(within(levels).getByLabelText('Level name'), { target: { value: 'Month' } })
    fireEvent.change(within(levels).getByLabelText('Days'), { target: { value: '30' } })
    fireEvent.click(within(levels).getByRole('button', { name: 'Add level' }))
    await waitFor(() => expect(api.createLevel).toHaveBeenCalledWith({ name: 'Month', intervalDays: 30 }))
  })

  test('tags by group with their word counts; a tag is added into its group, and a group can be added', async () => {
    renderAt('/english/settings/tags')
    const pos = await screen.findByRole('region', { name: 'Parts of speech' })
    expect(await within(pos).findByText('noun')).toBeTruthy()
    expect(within(pos).getByText('7 words')).toBeTruthy()
    const other = screen.getByRole('region', { name: 'Ungrouped' })
    expect(within(other).getByText('travel')).toBeTruthy()

    fireEvent.change(within(pos).getByLabelText('Tag name'), { target: { value: 'pronoun' } })
    fireEvent.click(within(pos).getByRole('button', { name: 'Add tag' }))
    await waitFor(() => expect(api.createTag).toHaveBeenCalledWith({ name: 'pronoun', groupId: 'g1' }))

    const groups = screen.getByRole('region', { name: 'Groups' })
    fireEvent.change(within(groups).getByLabelText('Group name'), { target: { value: 'Topics' } })
    fireEvent.click(within(groups).getByRole('button', { name: 'Add group' }))
    await waitFor(() => expect(api.createGroup).toHaveBeenCalledWith({ name: 'Topics' }))
  })

  test('a tag can be moved to another group', async () => {
    api.updateTag.mockResolvedValue(tag('t1', 'travel', { groupId: 'g1' }))
    renderAt('/english/settings/tags')
    const other = await screen.findByRole('region', { name: 'Ungrouped' })
    fireEvent.click(await within(other).findByRole('button', { name: 'Edit travel' }))
    fireEvent.change(within(other).getByLabelText('Group'), { target: { value: 'g1' } })
    fireEvent.click(within(other).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.updateTag).toHaveBeenCalledWith('t1', { name: 'travel', groupId: 'g1' }))
  })

  test('the seeded group names read in Uzbek', async () => {
    localStorage.setItem('iapp-lang', 'uz')
    renderAt('/english/settings/tags')
    expect(await screen.findByRole('region', { name: "So'z turkumi" })).toBeTruthy()
    localStorage.removeItem('iapp-lang')
  })

  test('speaks Uzbek and shows the seeded level as Yangi', async () => {
    localStorage.setItem('iapp-lang', 'uz')
    renderAt('/english/settings/levels')
    const levels = await screen.findByRole('region', { name: 'Darajalar' })
    expect(await within(levels).findByText('Yangi')).toBeTruthy()
    expect(within(levels).getByText('3 kun')).toBeTruthy()
    expect(within(levels).getByRole('button', { name: "Daraja qo'shish" })).toBeTruthy()
  })

  describe('while loading and saving', () => {
    test('levels load as placeholder rows inside the list, the add row ready below', () => {
      api.fetchLevels.mockReturnValue(pending())
      api.fetchEnglishSettings.mockReturnValue(pending())
      renderAt('/english/settings/levels')
      const levels = screen.getByRole('region', { name: 'Levels' })
      expect(loadingRegion('Loading…', levels)).toBeTruthy()
      expect(within(levels).getByRole('button', { name: 'Add level' })).toBeTruthy()
      // The daily number's field waits too.
      expect(loadingRegion('Loading…', screen.getByRole('region', { name: 'New words a day' }))).toBeTruthy()
    })

    test('tags load as placeholder shelves', () => {
      api.fetchTags.mockReturnValue(pending())
      renderAt('/english/settings/tags')
      expect(loadingRegion()).toBeTruthy()
      expect(screen.queryByRole('region', { name: 'Ungrouped' })).toBeNull()
      // Adding a group needs nothing loaded.
      expect(screen.getByRole('region', { name: 'Groups' })).toBeTruthy()
    })

    test('saving a level: the button says so and cannot be pressed again', async () => {
      api.updateLevel.mockReturnValue(pending())
      renderAt('/english/settings/levels')
      const levels = await screen.findByRole('region', { name: 'Levels' })
      fireEvent.click(await within(levels).findByRole('button', { name: 'Edit Three days' }))
      fireEvent.click(within(levels).getByRole('button', { name: 'Save' }))
      const busy = await within(levels).findByRole('button', { name: 'Saving…' })
      expect((busy as HTMLButtonElement).disabled).toBe(true)
      expect(busy.getAttribute('aria-busy')).toBe('true')
      expect((within(levels).getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true)
      fireEvent.click(busy)
      expect(api.updateLevel).toHaveBeenCalledTimes(1)
    })

    test('adding a level and the daily number show their pending state', async () => {
      api.createLevel.mockReturnValue(pending())
      api.updateEnglishSettings.mockReturnValue(pending())
      renderAt('/english/settings/levels')
      const levels = await screen.findByRole('region', { name: 'Levels' })
      fireEvent.change(within(levels).getByLabelText('Level name'), { target: { value: 'Month' } })
      fireEvent.change(within(levels).getByLabelText('Days'), { target: { value: '30' } })
      fireEvent.click(within(levels).getByRole('button', { name: 'Add level' }))
      expect(((await within(levels).findByRole('button', { name: 'Adding…' })) as HTMLButtonElement).disabled).toBe(true)

      const perDay = screen.getByRole('region', { name: 'New words a day' })
      fireEvent.change(await within(perDay).findByLabelText('New words a day'), { target: { value: '30' } })
      fireEvent.click(within(perDay).getByRole('button', { name: 'Save' }))
      expect(((await within(perDay).findByRole('button', { name: 'Saving…' })) as HTMLButtonElement).disabled).toBe(true)
    })

    test('deleting a tag: its button turns busy and cannot be pressed again', async () => {
      api.deleteTag.mockReturnValue(pending())
      renderAt('/english/settings/tags')
      const other = await screen.findByRole('region', { name: 'Ungrouped' })
      fireEvent.click(await within(other).findByRole('button', { name: 'Delete travel' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
      const busy = await within(other).findByRole('button', { name: 'Delete travel — Deleting…' })
      expect((busy as HTMLButtonElement).disabled).toBe(true)
      expect(busy.getAttribute('aria-busy')).toBe('true')
      expect(api.deleteTag).toHaveBeenCalledTimes(1)
    })

    test('adding a tag shows its pending state', async () => {
      api.createTag.mockReturnValue(pending())
      renderAt('/english/settings/tags')
      const pos = await screen.findByRole('region', { name: 'Parts of speech' })
      fireEvent.change(within(pos).getByLabelText('Tag name'), { target: { value: 'pronoun' } })
      fireEvent.click(within(pos).getByRole('button', { name: 'Add tag' }))
      expect(((await within(pos).findByRole('button', { name: 'Adding…' })) as HTMLButtonElement).disabled).toBe(true)
    })
  })
})
