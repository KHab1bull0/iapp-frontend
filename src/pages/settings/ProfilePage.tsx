import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '@/core/api/profile'
import { useAuth } from '@/core/contexts/AuthContext'
import { profileKey, useProfile } from '@/core/hooks/useProfile'
import { toast } from '@/core/components/ui/toast'
import { SettingsSubpage } from './SettingsSubpage'
import { apiErrorMessage } from './errors'
import s from './settings.module.scss'

const memberSince = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long' })

export function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, displayName } = useProfile()
  const qc = useQueryClient()
  // null until the user types: the field then shows the saved name.
  const [draft, setDraft] = useState<string | null>(null)
  const saved = profile?.displayName ?? ''
  const name = draft ?? saved

  const save = useMutation({
    mutationFn: () => updateProfile({ displayName: name }),
    onSuccess: (updated) => {
      qc.setQueryData(profileKey(user?.id), updated)
      setDraft(null)
      toast('Profile updated', 'success')
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  })

  const dirty = !!profile && name.trim() !== saved

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (dirty) save.mutate()
  }

  return (
    <SettingsSubpage title="Profile" description="How you appear in IAPP">
      <div className={s.hero}>
        <div className={s.avatarLg}>{(displayName || 'U')[0]}</div>
        <div>
          <div className={s.heroName}>{displayName}</div>
          <div className={s.rowSub}>@{user?.username}</div>
          {profile && (
            <div className={s.hint}>Member since {memberSince.format(new Date(profile.createdAt))}</div>
          )}
        </div>
      </div>

      <form className={clsx(s.card, s.settingsCard)} onSubmit={handleSubmit}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>Personal information</h2>
        </div>
        <div className={s.pwForm}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Display name</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                value={name}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={100}
                // Until the saved name arrives, typing would be overwritten by it.
                disabled={!profile}
                autoComplete="name"
                placeholder={user?.username}
                aria-label="Display name"
              />
            </div>
            <span className={s.hint}>Shown across IAPP instead of your username. Leave empty to use the username.</span>
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Username</span>
            <div className={s.inputWrap}>
              <input
                className={clsx(s.input, s.inputReadOnly)}
                value={user?.username ?? ''}
                readOnly
                aria-label="Username"
              />
            </div>
            <span className={s.hint}>Used to sign in. It can't be changed.</span>
          </label>
          <div className={s.formActions}>
            <button type="submit" className={s.btnPrimary} disabled={!dirty || save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </SettingsSubpage>
  )
}
