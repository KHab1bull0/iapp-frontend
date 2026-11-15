import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NEW, word } from '@/modules/english/test-data'
import { loadingRegion, pending } from '@/modules/english/test-loading'
import { WordFormPage } from './WordFormPage'

const api = vi.hoisted(() => ({
  fetchWord: vi.fn(),
  fetchLevels: vi.fn(),
  fetchTags: vi.fn(),
  fetchGroups: vi.fn(),
  fetchEnglishSettings: vi.fn(),
}))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/english/new" element={<WordFormPage />} />
          <Route path="/english/:id/edit" element={<WordFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('WordFormPage', () => {
  beforeEach(() => {
    api.fetchLevels.mockResolvedValue([NEW])
    api.fetchTags.mockResolvedValue([])
    api.fetchGroups.mockResolvedValue([])
    api.fetchEnglishSettings.mockResolvedValue({ newPerDay: 20 })
  })

  test('while the word to edit loads, the form is drawn with its labels and placeholders', () => {
    api.fetchWord.mockReturnValue(pending())
    renderAt('/english/w1/edit')
    expect(screen.getByRole('heading', { name: 'Edit word' })).toBeTruthy()
    const region = loadingRegion()
    for (const label of ['Word', 'Translation', 'English description', 'Level', 'Tags']) {
      expect(region.textContent).toContain(label)
    }
    expect(screen.queryByLabelText('Word')).toBeNull()
    expect(screen.queryByText(/Word not found/)).toBeNull()
  })

  test('then the word fills the form', async () => {
    api.fetchWord.mockResolvedValue(word('harbour'))
    renderAt('/english/w1/edit')
    expect(((await screen.findByLabelText('Word')) as HTMLInputElement).value).toBe('harbour')
    await screen.findByRole('radiogroup', { name: 'Level' })
    await screen.findByRole('button', { name: 'Add tag' })
    expect(screen.queryAllByText('Loading…')).toHaveLength(0)
  })
})
