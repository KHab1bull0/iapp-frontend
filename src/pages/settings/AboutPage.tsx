import { useState } from 'react'
import clsx from 'clsx'
import { RefreshCw } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import { SettingsSubpage } from './SettingsSubpage'
import s from './settings.module.scss'

function formatBuild(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'unknown'
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function AboutPage() {
  const [checking, setChecking] = useState(false)

  async function handleCheckUpdate() {
    if (!('serviceWorker' in navigator)) {
      toast('Not running as an installed app', 'error')
      return
    }
    setChecking(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        toast('No service worker registered', 'error')
        return
      }
      await registration.update()
      // registerType is 'autoUpdate', so a newer worker installs and takes
      // over by itself; the page still holds the bundle it booted with, so
      // reload to actually land on it.
      if (registration.installing || registration.waiting) {
        toast('New version found — reloading…', 'success')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        toast('Already up to date', 'success')
      }
    } catch {
      toast('Could not check for updates', 'error')
    } finally {
      setChecking(false)
    }
  }

  return (
    <SettingsSubpage title="About" description="Version and updates">
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.settingsRow}>
          <div>
            <div className={s.rowTitle}>IAPP</div>
            {/*
              An installed PWA can quietly keep running an old build, so show
              which one this is and let the user ask for a newer one.
            */}
            <div className={s.rowSub}>Built {formatBuild(__BUILD_TIME__)}</div>
          </div>
          <button className={s.btnSecondary} onClick={handleCheckUpdate} disabled={checking}>
            <RefreshCw size={14} /> {checking ? 'Checking…' : 'Check for updates'}
          </button>
        </div>
      </div>
    </SettingsSubpage>
  )
}
