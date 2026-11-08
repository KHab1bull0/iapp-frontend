import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import ExcelJS from 'exceljs'
import { todayYmd } from '@/core/lib/format'
import { tag, word } from '@/modules/english/test-data'
import { ImportPage } from './ImportPage'

const api = vi.hoisted(() => ({
  fetchTags: vi.fn(),
  fetchGroups: vi.fn(),
  fetchEnglishSettings: vi.fn(),
  fetchWords: vi.fn(),
  importWords: vi.fn(),
}))
vi.mock('@/modules/english/api/english', async (orig) => ({ ...(await orig<object>()), ...api }))

async function xlsx(rows: string[][]): Promise<File> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Words')
  for (const r of rows) ws.addRow(r)
  return new File([await wb.xlsx.writeBuffer()], 'words.xlsx')
}

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ImportPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ImportPage', () => {
  beforeEach(() => {
    api.fetchTags.mockResolvedValue([tag('t1', 'Work'), tag('t2', 'noun')])
    api.fetchGroups.mockResolvedValue([])
    api.fetchEnglishSettings.mockResolvedValue({ newPerDay: 20 })
    api.fetchWords.mockResolvedValue([word('apple')])
    api.importWords.mockResolvedValue({ created: 2, skipped: [], tagsCreated: ['Travel'] })
  })

  test('previews what each row will do, then adds only the new words', async () => {
    renderPage()
    const file = await xlsx([
      ['word', 'description', 'translation', 'tags'],
      ['deadline', 'the latest time', 'muddat', 'Work, noun'],
      ['apple', '', 'olma', ''],
      ['luggage', '', 'bagaj', 'Travel'],
      ['oops', '', '', ''],
    ])
    await waitFor(() => expect(api.fetchWords).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('Choose file'), { target: { files: [file] } })

    const preview = await screen.findByRole('region', { name: '2 words ready to add' })
    expect(within(preview).getByText('1 already in your vocabulary — skipped')).toBeTruthy()
    expect(within(preview).getByText('1 row with errors — not added')).toBeTruthy()
    expect(within(preview).getByText('New tags will be created: Travel')).toBeTruthy()
    expect(within(preview).getByText('No translation')).toBeTruthy()

    fireEvent.click(within(preview).getByRole('button', { name: 'Add 2 words' }))
    await waitFor(() =>
      expect(api.importWords).toHaveBeenCalledWith({
        today: todayYmd(),
        createTags: true,
        words: [
          expect.objectContaining({ word: 'deadline', translation: 'muddat', description: 'the latest time', tags: ['Work', 'noun'] }),
          expect.objectContaining({ word: 'luggage', translation: 'bagaj', tags: ['Travel'] }),
        ],
      }),
    )
    expect(await screen.findByRole('heading', { name: '2 words added' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start review' }).getAttribute('href')).toBe('/english/review')
  })

  test('says what is wrong with a file it cannot use', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Choose file'), { target: { files: [await xlsx([['english', 'uzbek'], ['a', 'b']])] } })
    expect((await screen.findByRole('alert')).textContent).toBe("The first row needs at least the 'word' and 'translation' columns.")
  })
})
