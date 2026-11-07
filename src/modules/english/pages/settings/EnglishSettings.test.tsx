import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NEW, L3, group, tag } from '@/modules/english/test-data'
import { EnglishSettingsLayout } from './EnglishSettingsLayout'
import { EnglishSettingsIndex } from './EnglishSettingsIndex'
import { LevelsPage } from './LevelsPage'
import { TagsPage } from './TagsPage'

const api = vi.hoisted(() => ({
  fetchLevels: vi.fn(),
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
})
