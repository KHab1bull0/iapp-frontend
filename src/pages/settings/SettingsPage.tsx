import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { LogOut, Sun, Moon } from 'lucide-react'
import { changePassword } from '@/core/api/auth'
import { useAuth } from '@/core/contexts/AuthContext'
import { useTheme } from '@/core/contexts/ThemeContext'
import { toast } from '@/core/components/ui/toast'
import { MODULES } from '@/modules/registry'
import s from './SettingsPage.module.scss'

interface ApiError {
  response?: { data?: { message?: string | string[] } }
}
function extractMessage(err: unknown): string {
  const e = err as ApiError
  const msg = e?.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  return msg ?? 'Something went wrong'
}

function formatBuild(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'unknown'
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
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

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError('New passwords do not match'); return }
    setPwLoading(true)
    try {
      await changePassword(currentPw, newPw)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      toast('Password changed successfully', 'success')
    } catch (err) {
      setPwError(extractMessage(err))
    } finally {
      setPwLoading(false)
    }
  }

  const initial = user?.username?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <div>
          <h1 className={s.h1}>Settings</h1>
          <div className={s.pageSub}>Modules &amp; account</div>
        </div>
      </header>

      {/* Module sections (Finance → Categories, …) */}
      {MODULES.map(({ id, settingsSection: Section }) => Section && <Section key={id} />)}

      {/* Appearance */}
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>Appearance</h2>
        </div>
        <div className={s.settingsRow}>
          <div>
            <div className={s.rowTitle}>Theme</div>
            <div className={s.rowSub}>Dark and light modes are both supported.</div>
          </div>
          <div className={s.themeSegment}>
            <button
              className={clsx(s.segment, theme === 'light' && s.active)}
              onClick={() => theme !== 'light' && toggleTheme()}
            >
              <Sun size={14} /> Light
            </button>
            <button
              className={clsx(s.segment, theme === 'dark' && s.active)}
              onClick={() => theme !== 'dark' && toggleTheme()}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className={s.pwForm}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Current password</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
                required
                minLength={4}
              />
            </div>
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>New password</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                required
                minLength={4}
                placeholder="At least 4 characters"
              />
            </div>
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Confirm new password</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                required
                minLength={4}
              />
            </div>
          </label>
          {pwError && <div className={s.formError} role="alert">{pwError}</div>}
          <div>
            <button type="submit" className={s.btnSecondary} disabled={pwLoading}>
              {pwLoading ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account */}
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>Account</h2>
        </div>
        <div className={s.settingsRow}>
          <div className={s.account}>
            <div className={s.avatar}>{initial}</div>
            <div>
              <div className={s.rowTitle}>{user?.username}</div>
              <div className={s.rowSub}>IAPP account</div>
            </div>
          </div>
          <button className={s.btnDestructive} onClick={logout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* About */}
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>About</h2>
        </div>
        <div className={s.settingsRow}>
          <div>
            <div className={s.rowTitle}>Version</div>
            {/*
              An installed app can silently keep running a build from weeks
              ago. Showing the build it is actually on turns "did the fix
              reach my phone?" from a guess into something you can read.
            */}
            <div className={s.rowSub}>Built {formatBuild(__BUILD_TIME__)}</div>
          </div>
          <button
            className={s.btnSecondary}
            onClick={handleCheckUpdate}
            disabled={checking}
          >
            {checking ? 'Checking…' : 'Check for updates'}
          </button>
        </div>
      </div>

    </div>
  )
}
