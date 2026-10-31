import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { setFormatLang } from '@/core/lib/format'
import { LanguageContext } from './context'
import { LANG_KEY, storedLang, type Lang } from './lang'

/** The app's language: Uzbek by default, English on request, remembered per device. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(storedLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* storage blocked: the choice lasts this visit */
    }
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    // Before the re-render, so formatted dates in it already use the new language.
    setFormatLang(next)
    setLangState(next)
  }, [])

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
}
