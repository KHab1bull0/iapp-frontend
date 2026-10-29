import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { changePassword } from '@/core/api/auth'
import { toast } from '@/core/components/ui/toast'
import { SettingsSubpage } from './SettingsSubpage'
import { apiErrorMessage } from './errors'
import s from './settings.module.scss'

export function SecurityPage() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

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
      setPwError(apiErrorMessage(err))
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <SettingsSubpage title="Security" description="Keep your account safe">
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>Change password</h2>
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
          <div className={s.formActions}>
            <button type="submit" className={s.btnPrimary} disabled={pwLoading}>
              {pwLoading ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </SettingsSubpage>
  )
}
