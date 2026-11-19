import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastHost } from '@/core/components/ui/toast'
import type { TaskGroup } from '@/modules/tasks/api/groups'
import { TaskSettingsPage } from './TaskSettingsPage'

const api = vi.hoisted(() => ({
  fetchGroups: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
}))
vi.mock('@/modules/tasks/api/groups', async (orig) => ({ ...(await orig<object>()), ...api }))

const WORK: TaskGroup = { id: 'g1', name: 'Work', color: '#93c5fd', createdAt: '' }
const HOME: TaskGroup = { id: 'g2', name: 'Home', color: null, createdAt: '' }

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <TaskSettingsPage />
        <ToastHost />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TaskSettingsPage', () => {
  beforeEach(() => {
    for (const fn of Object.values(api)) fn.mockReset()
    api.fetchGroups.mockResolvedValue([WORK, HOME])
  })

  test('the page and its groups, in the order they come', async () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Task settings' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Back/ })).toBeTruthy()
    const section = screen.getByRole('region', { name: 'Groups' })
    await within(section).findByText('Work')
    expect(within(section).getAllByText(/^(Work|Home)$/).map((n) => n.textContent)).toEqual(['Work', 'Home'])
  })

  test('with no groups, a hint says what they are for', async () => {
    api.fetchGroups.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/No groups yet/)).toBeTruthy()
  })

  test('adds a group by name, trimmed, and empties the field', async () => {
    api.createGroup.mockResolvedValue({ id: 'g3', name: 'Health', color: null, createdAt: '' })
    renderPage()
    await screen.findByText('Work')
    const add = screen.getByRole('button', { name: 'Add' }) as HTMLButtonElement
    expect(add.disabled).toBe(true)
    const field = screen.getByLabelText('Group name') as HTMLInputElement
    fireEvent.change(field, { target: { value: '  Health ' } })
    api.fetchGroups.mockResolvedValue([WORK, HOME, { id: 'g3', name: 'Health', color: null, createdAt: '' }])
    fireEvent.click(add)
    await waitFor(() => expect(api.createGroup).toHaveBeenCalledWith('Health', expect.anything()))
    expect(await screen.findByText('Health')).toBeTruthy()
    expect(field.value).toBe('')
  })

  test('a name taken already is said so, and the field keeps it', async () => {
    api.createGroup.mockRejectedValue({ response: { status: 409, data: { message: 'errors.group_exists' } } })
    renderPage()
    await screen.findByText('Work')
    const field = screen.getByLabelText('Group name') as HTMLInputElement
    fireEvent.change(field, { target: { value: 'work' } })
    fireEvent.submit(field.closest('form')!)
    expect(await screen.findByText('A group with this name exists')).toBeTruthy()
    expect(field.value).toBe('work')
  })

  test('edits a group name and colour; Cancel leaves it as it was', async () => {
    api.updateGroup.mockResolvedValue({ ...WORK, name: 'Office' })
    renderPage()
    await screen.findByText('Work') // wait for groups to load
    fireEvent.click(await screen.findByRole('button', { name: /Rename.*Work/ }))
    const field = screen.getByLabelText(/Name.*Work/) as HTMLInputElement
    expect(field.value).toBe('Work')
    fireEvent.change(field, { target: { value: 'Desk' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Work')).toBeTruthy()
    expect(api.updateGroup).not.toHaveBeenCalled()

    fireEvent.click(await screen.findByRole('button', { name: /Rename.*Work/ }))
    fireEvent.change(screen.getByLabelText(/Name.*Work/), { target: { value: 'Office ' } })
    api.fetchGroups.mockResolvedValue([{ ...WORK, name: 'Office' }, HOME])
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.updateGroup).toHaveBeenCalledWith('g1', 'Office', WORK.color))
    expect(await screen.findByText('Office')).toBeTruthy()
    expect(screen.queryByLabelText(/Name.*Work/)).toBeNull()
  })

  test('a group can take a ready colour, any other colour, or none', async () => {
    api.updateGroup.mockResolvedValue(WORK)
    renderPage()
    await screen.findByText('Work')
    fireEvent.click(screen.getByRole('button', { name: /Rename.*Work/ }))
    const editForm = () => screen.getByLabelText(/Name.*Work/).closest('form')!
    const picker = within(editForm()).getByRole('group', { name: 'Colour' })
    // A colour of one's own, from the system picker.
    fireEvent.change(within(picker).getByLabelText('Pick another colour'), { target: { value: '#123abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.updateGroup).toHaveBeenLastCalledWith('g1', 'Work', '#123abc'))

    api.fetchGroups.mockResolvedValue([{ ...WORK, color: '#123abc' }, HOME])
    fireEvent.click(await screen.findByRole('button', { name: /Rename.*Work/ }))
    fireEvent.click(within(editForm()).getByRole('button', { name: '#ef4444' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.updateGroup).toHaveBeenLastCalledWith('g1', 'Work', '#ef4444'))

    fireEvent.click(await screen.findByRole('button', { name: /Rename.*Work/ }))
    fireEvent.click(within(editForm()).getByRole('button', { name: 'No colour' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.updateGroup).toHaveBeenLastCalledWith('g1', 'Work', null))
  })

  test('an edit to a taken name is said so and stays open', async () => {
    api.updateGroup.mockRejectedValue({ response: { status: 409, data: { message: 'errors.group_exists' } } })
    renderPage()
    await screen.findByText('Work')
    fireEvent.click(await screen.findByRole('button', { name: /Rename.*Work/ }))
    fireEvent.change(screen.getByLabelText(/Name.*Work/), { target: { value: 'Home' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('A group with this name exists')).toBeTruthy()
    expect(screen.getByLabelText(/Name.*Work/)).toBeTruthy()
  })

  test('deletes a group only after confirming', async () => {
    api.deleteGroup.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Home')
    fireEvent.click(await screen.findByRole('button', { name: /Delete.*Home/ }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/Delete.*group.*Home/)).toBeTruthy()
    expect(within(dialog).getByText('Its tasks stay, just without a group.')).toBeTruthy()
    expect(api.deleteGroup).toHaveBeenCalledTimes(0)
    api.fetchGroups.mockResolvedValue([WORK])
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(api.deleteGroup).toHaveBeenCalledWith('g2'))
    await waitFor(() => expect(screen.queryByText('Home')).toBeNull())
  })
})
