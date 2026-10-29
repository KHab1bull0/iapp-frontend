import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ModuleCardBoundary } from './ModuleCardBoundary'

function Boom(): never {
  throw new Error('card exploded')
}

describe('ModuleCardBoundary', () => {
  test('a crashing card is replaced by a notice while its neighbour still renders', () => {
    // React logs caught render errors; keep the test output clean.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <>
        <ModuleCardBoundary moduleName="Broken">
          <Boom />
        </ModuleCardBoundary>
        <ModuleCardBoundary moduleName="Fine">
          <p>ok</p>
        </ModuleCardBoundary>
      </>,
    )
    expect(screen.getByText('ok')).toBeTruthy()
    expect(screen.getByText(/Broken couldn't load/)).toBeTruthy()
    spy.mockRestore()
  })
})
