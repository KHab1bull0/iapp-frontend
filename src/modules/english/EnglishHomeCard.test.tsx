import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import { englishKeys } from './api/english'
import { word } from './test-data'
import { EnglishHomeCard } from './EnglishHomeCard'

describe('EnglishHomeCard', () => {
  test('shows how many words are waiting and links to Review', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    qc.setQueryData(englishKeys.review(todayYmd()), [word('a'), word('b'), word('c')])
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <EnglishHomeCard />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.getByText('3 words to memorise')).toBeTruthy()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/english/review')
  })
})
