import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { monthGrid } from '@/core/lib/calendar'
import { setFormatLang, todayYmd } from '@/core/lib/format'
import { Calendar } from './Calendar'
import { DateField } from './DateField'
import { EmptyState } from './EmptyState'
import { ListGroup, ListRow } from './List'
import { ProgressBar, ProgressRing } from './Progress'
import { SegmentedControl } from './SegmentedControl'
import { StatTile } from './StatTile'

describe('SegmentedControl', () => {
  test('is one radio group and reports the choice', () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        label="Period"
        value="day"
        onChange={onChange}
        options={[
          { value: 'day', label: 'Day' },
          { value: 'month', label: 'Month' },
        ]}
      />,
    )
    expect(screen.getByRole('radiogroup', { name: 'Period' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Day' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(screen.getByRole('radio', { name: 'Month' }))
    expect(onChange).toHaveBeenCalledWith('month')
  })
})

describe('EmptyState', () => {
  test('carries the action it asks for', () => {
    const onClick = vi.fn()
    render(<EmptyState icon={Inbox} title="Nothing yet" description="Add one" action={{ label: 'Add', onClick }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onClick).toHaveBeenCalled()
  })

  test('can link instead', () => {
    render(
      <MemoryRouter>
        <EmptyState title="Nothing yet" action={{ label: 'Open', to: '/x' }} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Open' }).getAttribute('href')).toBe('/x')
  })
})

describe('ListRow', () => {
  test('is a link with a chevron when it goes somewhere', () => {
    render(
      <MemoryRouter>
        <ListGroup title="Account">
          <ListRow title="Profile" subtitle="Name" to="/settings/profile" />
          <ListRow title="Version" value="1.0" />
        </ListGroup>
      </MemoryRouter>,
    )
    expect(screen.getByRole('region', { name: 'Account' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Profile/ }).getAttribute('href')).toBe('/settings/profile')
    expect(screen.getByText('1.0')).toBeTruthy()
  })
})

describe('Progress', () => {
  test('bar and ring expose their value', () => {
    render(
      <>
        <ProgressBar label="Budget" value={30} max={100} />
        <ProgressRing label="Today" value={2} max={5}>
          2/5
        </ProgressRing>
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'Budget' }).getAttribute('aria-valuenow')).toBe('30')
    expect(screen.getByRole('progressbar', { name: 'Today' }).getAttribute('aria-valuemax')).toBe('5')
    expect(screen.getByText('2/5')).toBeTruthy()
  })
})

describe('StatTile', () => {
  test('shows label, value and note', () => {
    render(<StatTile label="Spent" value="120 000" sub="this month" />)
    expect(screen.getByText('Spent')).toBeTruthy()
    expect(screen.getByText('120 000')).toBeTruthy()
    expect(screen.getByText('this month')).toBeTruthy()
  })
})

describe('monthGrid', () => {
  test('starts on Monday', () => {
    // 1 Nov 2026 is a Sunday: six blanks before it.
    const cells = monthGrid('2026-11')
    expect(cells.slice(0, 7)).toEqual([null, null, null, null, null, null, '2026-11-01'])
    expect(cells.filter(Boolean)).toHaveLength(30)
  })
})

describe('Calendar', () => {
  test('picks a day and moves between months', () => {
    const onChange = vi.fn()
    render(<Calendar value="2026-11-06" today="2026-11-06" onChange={onChange} />)
    expect(screen.getByText('November 2026')).toBeTruthy()
    fireEvent.click(screen.getByRole('gridcell', { name: /12 November 2026/ }))
    expect(onChange).toHaveBeenCalledWith('2026-11-12')
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByText('December 2026')).toBeTruthy()
  })

  test('speaks Uzbek', () => {
    localStorage.setItem('iapp-lang', 'uz')
    setFormatLang('uz')
    render(<Calendar value={null} today="2026-11-06" onChange={() => {}} />)
    expect(screen.getByRole('columnheader', { name: 'Du' })).toBeTruthy()
    expect(screen.getByText('Noyabr 2026')).toBeTruthy()
  })
})

describe('DateField', () => {
  test('names today and tomorrow, and picks from its quick chips', () => {
    const onChange = vi.fn()
    render(<DateField label="Date" value={todayYmd()} onChange={onChange} clearable />)
    const field = screen.getByRole('button', { name: 'Date: Today' })
    fireEvent.click(field)
    fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).not.toBe(todayYmd())
  })
})
