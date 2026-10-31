import { createContext, useContext } from 'react'
import { setFormatLang } from '@/core/lib/format'
import { storedLang, type Lang } from './lang'

export interface LanguageValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const LanguageContext = createContext<LanguageValue | null>(null)

/** Outside a provider (tests, isolated renders) this falls back to the stored language. */
export function useLang(): LanguageValue {
  return useContext(LanguageContext) ?? { lang: storedLang(), setLang: setFormatLang }
}

/**
 * Pairs a module's Uzbek and English messages. Uzbek is the source: English
 * must have exactly the same keys and the same function signatures, or the
 * build fails, so no string can be left untranslated.
 */
export function defineMessages<T extends object>(uz: T, en: T): Record<Lang, T> {
  return { uz, en }
}

/** The messages for the current language. */
export function useMessages<T>(messages: Record<Lang, T>): T {
  return messages[useLang().lang]
}

/** Text given in both languages (module names, page labels in manifests), or a plain string. */
export type Text = string | Record<Lang, string>

export function localize(text: Text, lang: Lang): string {
  return typeof text === 'string' ? text : text[lang]
}

export function useText(): (text: Text) => string {
  const { lang } = useLang()
  return (text) => localize(text, lang)
}
