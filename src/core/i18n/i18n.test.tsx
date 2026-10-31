import { afterEach, describe, expect, test } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { LanguageProvider, defineMessages, useLang, useMessages, useText } from './index'
import { formatMonthLong, setFormatLang } from '@/core/lib/format'

const messages = defineMessages(
  { hello: 'Salom', count: (n: number) => `${n} ta so'z` },
  { hello: 'Hello', count: (n: number) => `${n} word${n === 1 ? '' : 's'}` },
)

function Probe() {
  const { lang, setLang } = useLang()
  const t = useMessages(messages)
  const text = useText()
  return (
    <>
      <p>{t.hello}</p>
      <p>{t.count(2)}</p>
      <p>{text({ uz: 'Moliya', en: 'Finance' })}</p>
      <button onClick={() => setLang(lang === 'uz' ? 'en' : 'uz')}>switch</button>
    </>
  )
}

describe('i18n', () => {
  afterEach(() => {
    localStorage.setItem('iapp-lang', 'en')
    setFormatLang('en')
  })

  test('Uzbek is the default, and the choice is remembered', () => {
    localStorage.removeItem('iapp-lang')
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )
    expect(screen.getByText('Salom')).toBeTruthy()
    expect(screen.getByText("2 ta so'z")).toBeTruthy()
    expect(screen.getByText('Moliya')).toBeTruthy()
    expect(document.documentElement.lang).toBe('uz')

    act(() => screen.getByText('switch').click())
    expect(screen.getByText('Hello')).toBeTruthy()
    expect(screen.getByText('2 words')).toBeTruthy()
    expect(screen.getByText('Finance')).toBeTruthy()
    expect(localStorage.getItem('iapp-lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  test('dates follow the language', () => {
    setFormatLang('en')
    expect(formatMonthLong('2026-10')).toMatch(/October/)
    setFormatLang('uz')
    expect(formatMonthLong('2026-10')).toMatch(/oktabr/i)
  })
})
