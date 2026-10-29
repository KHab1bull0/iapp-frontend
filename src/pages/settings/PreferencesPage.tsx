import clsx from 'clsx'
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme, type ThemePreference } from '@/core/contexts/ThemeContext'
import { SettingsSubpage } from './SettingsSubpage'
import s from './settings.module.scss'

const THEMES: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function PreferencesPage() {
  const { preference, setPreference } = useTheme()

  return (
    <SettingsSubpage title="Preferences" description="How IAPP looks and reads on this device">
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>Appearance</h2>
        </div>
        <div className={s.settingsRow}>
          <div>
            <div className={s.rowTitle}>Theme</div>
            <div className={s.rowSub}>System follows your device's light or dark mode.</div>
          </div>
          <div className={s.themeSegment} role="radiogroup" aria-label="Theme">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                role="radio"
                aria-checked={preference === value}
                className={clsx(s.segment, preference === value && s.active)}
                onClick={() => setPreference(value)}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>
            Language <span className={s.badge}>Soon</span>
          </h2>
        </div>
        <div className={s.settingsRow}>
          <div>
            <div className={s.rowTitle}>App language</div>
            <div className={s.rowSub}>IAPP is in English for now. O'zbekcha and Русский are on the way.</div>
          </div>
          <select className={s.select} value="en" disabled aria-label="App language">
            <option value="en">English</option>
            <option value="uz">O'zbekcha</option>
            <option value="ru">Русский</option>
          </select>
        </div>
      </div>
    </SettingsSubpage>
  )
}
