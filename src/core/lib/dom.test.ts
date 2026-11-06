import { afterEach, describe, expect, test } from 'vitest'
import { isDialogOpen } from './dom'

describe('isDialogOpen', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('a closed drawer kept in the DOM (inert) does not count', () => {
    document.body.innerHTML = '<div role="dialog" inert></div>'
    expect(isDialogOpen()).toBe(false)
    document.body.innerHTML += '<div role="alertdialog"></div>'
    expect(isDialogOpen()).toBe(true)
  })
})
