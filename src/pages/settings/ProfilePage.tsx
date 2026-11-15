import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '@/core/api/profile'
import { useAuth } from '@/core/contexts/AuthContext'
import { profileKey, useProfile } from '@/core/hooks/useProfile'
import { Skeleton, SkeletonGroup } from '@/core/components/ui/Skeleton'
import { toast } from '@/core/components/ui/toast'
import { SettingsSubpage } from './SettingsSubpage'
import { useLang } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { apiErrorText } from '@/core/i18n/errors'
import { formatMonthLong, ymd } from '@/core/lib/format'
import s from './settings.module.scss'

export function ProfilePage() {
  const { user } = useAuth()
  const { lang } = useLang()
  const t = useCoreT()
  const { data: profile, displayName, isLoading } = useProfile()
  // Only the first load: a refetch keeps what is on screen.
  const loading = !profile && isLoading
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
      toast(t.profile.updated, 'success')
    },
    onError: (err) => toast(apiErrorText(err, lang), 'error'),
  })

  const dirty = !!profile && name.trim() !== saved

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (dirty) save.mutate()
  }

  return (
    <SettingsSubpage title={t.settings.profile} description={t.settings.profileSub}>
      <div className={s.hero}>
        <div className={s.avatarLg}>{(displayName || 'U')[0]}</div>
        {loading ? (
          // The three lines it stands in for; shorter than the 64px avatar, as
          // the text is, so the card keeps its height when the name arrives.
          <SkeletonGroup className={s.heroSkeleton}>
            <Skeleton width={160} height="var(--fs-h2)" />
            <Skeleton width={96} height="var(--fs-meta)" />
            <Skeleton width={128} height="var(--fs-caption)" />
          </SkeletonGroup>
        ) : (
          <div>
            <div className={s.heroName}>{displayName}</div>
            <div className={s.rowSub}>@{user?.username}</div>
            {profile && (
              <div className={s.hint}>{t.profile.memberSince(formatMonthLong(ymd(new Date(profile.createdAt)).slice(0, 7)))}</div>
            )}
          </div>
        )}
      </div>

      <form className={clsx(s.card, s.settingsCard)} onSubmit={handleSubmit} aria-busy={loading || undefined}>
        <div className={s.cardHead}>
          <h2 className={s.h3}>{t.profile.personalInfo}</h2>
        </div>
        <div className={s.pwForm}>
          <label className={s.field}>
            <span className={s.fieldLabel}>{t.profile.displayName}</span>
            {loading ? (
              // Until the saved name arrives, typing would be overwritten by it.
              <Skeleton height="var(--control-md)" radius="var(--radius-md)" />
            ) : (
              <div className={s.inputWrap}>
                <input
                  className={s.input}
                  value={name}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={100}
                  // Still nothing to edit if the profile didn't load.
                  disabled={!profile}
                  autoComplete="name"
                  placeholder={user?.username}
                  aria-label={t.profile.displayName}
                />
              </div>
            )}
            <span className={s.hint}>{t.profile.displayNameHint}</span>
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>{t.profile.username}</span>
            <div className={s.inputWrap}>
              <input
                className={clsx(s.input, s.inputReadOnly)}
                value={user?.username ?? ''}
                readOnly
                aria-label={t.profile.username}
              />
            </div>
            <span className={s.hint}>{t.profile.usernameHint}</span>
          </label>
          <div className={s.formActions}>
            <button type="submit" className={s.btnPrimary} disabled={!dirty || save.isPending} aria-busy={save.isPending || undefined}>
              {save.isPending ? t.common.saving : t.common.save}
            </button>
          </div>
        </div>
      </form>
    </SettingsSubpage>
  )
}
