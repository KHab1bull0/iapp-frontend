import { useState } from 'react'
import clsx from 'clsx'
import { RefreshCw } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import { useCoreT } from '@/core/i18n/useCoreT'
import { formatFullDate } from '@/core/lib/format'
import { SettingsSubpage } from './SettingsSubpage'
import s from './settings.module.scss'

function formatBuild(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${formatFullDate(d)}, ${d.toTimeString().slice(0, 5)}`
}

export function AboutPage() {
  const t = useCoreT()
  const [checking, setChecking] = useState(false)

  async function handleCheckUpdate() {
    if (!('serviceWorker' in navigator)) {
      toast(t.about.notInstalled, 'error')
      return
    }
    setChecking(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        toast(t.about.noWorker, 'error')
        return
      }
      await registration.update()
      // registerType is 'autoUpdate', so a newer worker installs and takes
      // over by itself; the page still holds the bundle it booted with, so
      // reload to actually land on it.
      if (registration.installing || registration.waiting) {
        toast(t.about.found, 'success')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        toast(t.about.upToDate, 'success')
      }
    } catch {
      toast(t.about.failed, 'error')
    } finally {
      setChecking(false)
    }
  }

  return (
    <SettingsSubpage title={t.settings.about} description={t.settings.aboutDesc}>
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.settingsRow}>
          <div>
            <div className={s.rowTitle}>IAPP</div>
            {/*
              An installed PWA can quietly keep running an old build, so show
              which one this is and let the user ask for a newer one.
            */}
            <div className={s.rowSub}>{t.about.built(formatBuild(__BUILD_TIME__) ?? t.about.unknown)}</div>
          </div>
          <button className={s.btnSecondary} onClick={handleCheckUpdate} disabled={checking}>
            <RefreshCw size={14} /> {checking ? t.about.checking : t.about.check}
          </button>
        </div>
      </div>
    </SettingsSubpage>
  )
}
