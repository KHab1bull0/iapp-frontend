import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { changePassword } from '@/core/api/auth'
import { toast } from '@/core/components/ui/toast'
import { SettingsSubpage } from './SettingsSubpage'
import { useLang } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { apiErrorText } from '@/core/i18n/errors'
import s from './settings.module.scss'

export function SecurityPage() {
  const { lang } = useLang()
  const t = useCoreT()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError(t.security.mismatch); return }
    setPwLoading(true)
    try {
      await changePassword(currentPw, newPw)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      toast(t.security.changed, 'success')
    } catch (err) {
      setPwError(apiErrorText(err, lang))
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <SettingsSubpage title={t.settings.security} description={t.settings.securitySub}>
      <div className={clsx(s.card, s.settingsCard)}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>{t.security.changePassword}</h2>
        </div>
        <form onSubmit={handleChangePassword} className={s.pwForm}>
          <label className={s.field}>
            <span className={s.fieldLabel}>{t.security.current}</span>
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
            <span className={s.fieldLabel}>{t.security.next}</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                required
                minLength={4}
                placeholder={t.security.nextPlaceholder}
              />
            </div>
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>{t.security.confirm}</span>
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
              {pwLoading ? t.common.saving : t.security.submit}
            </button>
          </div>
        </form>
      </div>
    </SettingsSubpage>
  )
}
