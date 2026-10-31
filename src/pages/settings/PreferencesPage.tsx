import clsx from 'clsx'
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme, type ThemePreference } from '@/core/contexts/ThemeContext'
import { useLang, type Lang } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { SettingsSubpage } from './SettingsSubpage'
import s from './settings.module.scss'

const THEME_ICONS: Record<ThemePreference, LucideIcon> = { light: Sun, dark: Moon, system: Monitor }

/** Each language named in itself, so it can be found whichever one is on screen. */
const LANGUAGE_NAMES: Record<Lang, string> = { uz: "O'zbekcha", en: 'English' }

export function PreferencesPage() {
  const { preference, setPreference } = useTheme()
  const { lang, setLang } = useLang()
  const t = useCoreT()
  const themes: ThemePreference[] = ['light', 'dark', 'system']

  return (
    <SettingsSubpage title={t.settings.preferences} description={t.settings.preferencesSub}>
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>{t.preferences.appearance}</h2>
        </div>
        <div className={s.settingsRow}>
          <div>
            <div className={s.rowTitle}>{t.preferences.theme}</div>
            <div className={s.rowSub}>{t.preferences.themeHint}</div>
          </div>
          <div className={s.themeSegment} role="radiogroup" aria-label={t.preferences.theme}>
            {themes.map((value) => {
              const Icon = THEME_ICONS[value]
              return (
                <button
                  key={value}
                  role="radio"
                  aria-checked={preference === value}
                  className={clsx(s.segment, preference === value && s.active)}
                  onClick={() => setPreference(value)}
                >
                  <Icon size={14} /> {t.preferences[value]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>{t.preferences.language}</h2>
        </div>
        <div className={s.settingsRow}>
          <div>
            <div className={s.rowTitle}>{t.preferences.appLanguage}</div>
            <div className={s.rowSub}>{t.preferences.languageHint}</div>
          </div>
          <div className={s.themeSegment} role="radiogroup" aria-label={t.preferences.appLanguage}>
            {(Object.keys(LANGUAGE_NAMES) as Lang[]).map((value) => (
              <button
                key={value}
                role="radio"
                lang={value}
                aria-checked={lang === value}
                className={clsx(s.segment, lang === value && s.active)}
                onClick={() => setLang(value)}
              >
                {LANGUAGE_NAMES[value]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingsSubpage>
  )
}
