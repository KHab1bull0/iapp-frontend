import { lazy, Suspense } from 'react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChunkErrorBoundary } from './ChunkErrorBoundary'
import { isChunkLoadError } from '@/core/lib/chunk-reload'

// What a lazy page does after a deploy has removed its old hashed chunk.
const StalePage = lazy(() =>
  Promise.reject(new TypeError('Failed to fetch dynamically imported module: /assets/overview-old.js')),
)

describe('isChunkLoadError', () => {
  test('recognises the messages Chrome, Safari and Firefox use', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: x'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module: x'))).toBe(true)
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
  })
})

describe('ChunkErrorBoundary', () => {
  beforeEach(() => sessionStorage.clear())

  test('reloads once when a page chunk from an older build is gone', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    render(
      <ChunkErrorBoundary reload={reload}>
        <Suspense fallback={null}>
          <StalePage />
        </Suspense>
      </ChunkErrorBoundary>,
    )
    await screen.findByRole('button', { name: /reload/i })
    expect(reload).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  test('does not loop: a second failure right after a reload shows a button instead', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    sessionStorage.setItem('iapp-chunk-reload', String(Date.now()))
    const reload = vi.fn()
    render(
      <ChunkErrorBoundary reload={reload}>
        <Suspense fallback={null}>
          <StalePage />
        </Suspense>
      </ChunkErrorBoundary>,
    )
    await screen.findByRole('button', { name: /reload/i })
    expect(reload).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
