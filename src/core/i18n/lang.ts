export type Lang = 'uz' | 'en'
export const LANGS: Lang[] = ['uz', 'en']
export const LANG_KEY = 'iapp-lang'

/** Uzbek unless English was chosen on this device. */
export function storedLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'uz'
  } catch {
    return 'uz'
  }
}
