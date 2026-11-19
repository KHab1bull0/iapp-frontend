import { useEffect, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  BellOff,
  BellRing,
  BookOpen,
  Clock,
  ListChecks,
  Monitor,
  RefreshCw,
  Repeat,
  Send,
  Share,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'
import {
  fetchDevices,
  fetchSettings,
  notificationKeys,
  sendTest,
  updateSettings,
  type NotificationSettings,
  type PushDevice,
} from '@/core/notifications/api'
import { deviceName } from '@/core/notifications/device'
import { usePushState } from '@/core/notifications/usePushState'
import { ListGroup, ListRow, ListSkeleton } from '@/core/components/ui/List'
import { Skeleton, SkeletonGroup } from '@/core/components/ui/Skeleton'
import { Switch } from '@/core/components/ui/Switch'
import { toast } from '@/core/components/ui/toast'
import { useDayLabel } from '@/core/hooks/useDayLabel'
import { useCoreT } from '@/core/i18n/useCoreT'
import { ymd } from '@/core/lib/format'
import { SettingsSubpage } from './SettingsSubpage'
import s from './settings.module.scss'

type Tone = 'on' | 'muted' | 'danger'

interface StatusProps {
  icon: LucideIcon
  tone: Tone
  title: string
  hint?: string
  steps?: string[]
  children?: ReactNode
}

/** Where push stands on this device, what (if anything) can be done, and the button to do it. */
function StatusCard({ icon: Icon, tone, title, hint, steps, children }: StatusProps) {
  return (
    <section className={clsx(s.card, s.settingsCard)} aria-label={title}>
      <div className={s.pushStatus}>
        <span className={clsx(s.pushIcon, s[`pushIcon_${tone}`])} aria-hidden>
          <Icon size={20} />
        </span>
        <div className={s.rowText}>
          <h2 className={s.h3}>{title}</h2>
          {hint && <div className={s.rowSub}>{hint}</div>}
        </div>
      </div>
      {steps && (
        <ol className={s.pushSteps}>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {children && <div className={s.pushActions}>{children}</div>}
    </section>
  )
}

/** A StatusCard while this device's push state is worked out: icon, two lines, a button. */
function StatusSkeleton() {
  return (
    <SkeletonGroup className={clsx(s.card, s.settingsCard)}>
      <div className={s.pushStatus}>
        <Skeleton width="var(--tile-lg)" height="var(--tile-lg)" radius="var(--radius-sm)" />
        <div className={s.statusSkeletonText}>
          <Skeleton width="50%" height="var(--lh-title)" />
          <Skeleton width="80%" height="var(--lh-meta)" />
        </div>
      </div>
      <div className={s.pushActions}>
        <Skeleton width={160} height="var(--control-md)" radius="var(--radius-md)" />
      </div>
    </SkeletonGroup>
  )
}

/**
 * Saves a short while after the last change rather than on every one: on a
 * desktop each typed digit is a complete, valid time, and each would be a PATCH.
 */
function TimeInput({ value, label, onCommit }: { value: string; label: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  function commit(next: string) {
    clearTimeout(timer.current)
    const hhmm = next.slice(0, 5)
    // Cleared or half-typed: fall back to the saved time instead of sending it.
    if (/^\d{2}:\d{2}$/.test(hhmm) && hhmm !== value) onCommit(hhmm)
    setDraft(null)
  }

  return (
    <div className={clsx(s.inputWrap, s.timeWrap)}>
      <input
        type="time"
        className={s.input}
        value={draft ?? value}
        aria-label={label}
        onChange={(e) => {
          const next = e.target.value
          setDraft(next)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => commit(next), 800)
        }}
        onBlur={() => draft !== null && commit(draft)}
      />
    </div>
  )
}

type Keys<V> = { [K in keyof NotificationSettings]: NotificationSettings[K] extends V ? K : never }[keyof NotificationSettings]

/** A reminder's switch and, if it fires at times the user picks, those times (each its own row). */
interface Reminder {
  on: Keys<boolean>
  times?: { key: Keys<string>; label: string }[]
  icon: LucideIcon
  title: string
  hint: string
}

function Reminders() {
  const t = useCoreT().notifications
  const qc = useQueryClient()
  const settings = useQuery({ queryKey: notificationKeys.settings, queryFn: fetchSettings })

  // Optimistic: a switch that waits for the network feels broken.
  const save = useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) => updateSettings(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: notificationKeys.settings })
      const prev = qc.getQueryData<NotificationSettings>(notificationKeys.settings)
      if (prev) qc.setQueryData(notificationKeys.settings, { ...prev, ...patch })
      return { prev }
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationKeys.settings, ctx.prev)
      toast(t.saveFailed, 'error')
    },
    onSuccess: (data) => qc.setQueryData(notificationKeys.settings, data),
  })

  if (settings.isPending) {
    // The heading, rows and footer it stands in for, so the page doesn't jump.
    return <ListSkeleton title rows={4} footer />
  }
  if (settings.isError) {
    return (
      <ListGroup title={t.reminders}>
        <ListRow icon={RefreshCw} title={t.loadFailed} onClick={() => void settings.refetch()} />
      </ListGroup>
    )
  }

  const data = settings.data
  const reminders: Reminder[] = [
    {
      on: 'tasksDigest',
      // The first and the last hourly push.
      times: [
        { key: 'tasksDigestAt', label: t.from },
        { key: 'tasksDigestUntil', label: t.until },
      ],
      icon: ListChecks,
      title: t.tasksDigest,
      hint: t.tasksDigestHint,
    },
    // Each task reminds by its own time and its own "remind before", so this one has no time row.
    { on: 'habitReminders', icon: Repeat, title: t.habitReminders, hint: t.habitRemindersHint },
    {
      on: 'englishReminder',
      times: [{ key: 'englishReminderAt', label: t.time }],
      icon: BookOpen,
      title: t.englishReminder,
      hint: t.englishReminderHint,
    },
  ]

  // The server refuses an hourly window that ends before it starts; say why here instead.
  function saveTime(key: Keys<string>, value: string) {
    const next = { ...data, [key]: value }
    if (next.tasksDigestUntil < next.tasksDigestAt) toast(t.rangeInvalid, 'error')
    else save.mutate({ [key]: value })
  }

  return (
    <ListGroup title={t.reminders} footer={t.remindersFooter}>
      {reminders.flatMap(({ on, times = [], icon, title, hint }) => [
        <ListRow
          key={on}
          icon={icon}
          title={title}
          subtitle={hint}
          trailing={<Switch checked={data[on]} label={title} onChange={(next) => save.mutate({ [on]: next })} />}
        />,
        // The times only matter while the reminder is on (iOS Settings does the same).
        ...(data[on]
          ? times.map(({ key, label }) => (
              <ListRow
                key={key}
                icon={Clock}
                title={label}
                trailing={<TimeInput value={data[key]} label={t.timeOf(title, label)} onCommit={(v) => saveTime(key, v)} />}
              />
            ))
          : []),
      ])}
    </ListGroup>
  )
}

const PHONES = /iPhone|iPad|Android/

function Devices() {
  const t = useCoreT().notifications
  const dayLabel = useDayLabel()
  const devices = useQuery({ queryKey: notificationKeys.devices, queryFn: fetchDevices })

  // Nothing to show until there is a device; the status card above already says how to add this one.
  if (!devices.data?.length) return null

  const delivered = (d: PushDevice) => {
    if (!d.lastSuccessAt) return t.neverDelivered
    const at = new Date(d.lastSuccessAt)
    return t.lastDelivered(`${dayLabel(ymd(at))}, ${at.toTimeString().slice(0, 5)}`)
  }

  return (
    <ListGroup title={t.devices}>
      {devices.data.map((d) => {
        const name = deviceName(d.userAgent) || t.unknownDevice
        return <ListRow key={d.id} icon={PHONES.test(name) ? Smartphone : Monitor} title={name} subtitle={delivered(d)} />
      })}
    </ListGroup>
  )
}

export function NotificationsPage() {
  const tc = useCoreT()
  const t = tc.notifications
  const push = usePushState()

  async function handleEnable() {
    try {
      const permission = await push.enable()
      if (permission === 'granted') toast(t.enabled, 'success')
      // 'denied' redraws the page as the blocked state; nothing to add.
      else if (permission === 'default') toast(t.dismissed, 'error')
    } catch {
      toast(t.enableFailed, 'error')
    }
  }

  async function handleDisable() {
    try {
      await push.disable()
      toast(t.disabled, 'success')
    } catch {
      toast(t.disableFailed, 'error')
    }
  }

  const test = useMutation({
    mutationFn: () => sendTest(),
    onSuccess: (sent) => (sent > 0 ? toast(t.testSent(sent), 'success') : toast(t.testNone, 'error')),
    onError: (err) => {
      const status = (err as { response?: { status?: number } }).response?.status
      toast(status === 503 ? t.notConfiguredTitle : t.testFailed, 'error')
    },
  })

  let body: ReactNode
  switch (push.state) {
    case 'loading':
      body = <StatusSkeleton />
      break
    case 'error':
      body = (
        <StatusCard icon={BellOff} tone="muted" title={t.loadFailed}>
          <button type="button" className={s.pushSecondary} onClick={() => void push.retry()}>
            <RefreshCw size={16} aria-hidden /> {tc.common.retry}
          </button>
        </StatusCard>
      )
      break
    case 'unsupported':
      body = <StatusCard icon={BellOff} tone="muted" title={t.unsupportedTitle} hint={t.unsupportedHint} />
      break
    case 'ios-needs-install':
      body = <StatusCard icon={Share} tone="muted" title={t.iosTitle} hint={t.iosHint} steps={t.iosSteps} />
      break
    case 'not-configured':
      body = <StatusCard icon={BellOff} tone="muted" title={t.notConfiguredTitle} hint={t.notConfiguredHint} />
      break
    case 'denied':
      body = (
        <>
          <StatusCard icon={BellOff} tone="danger" title={t.deniedTitle} hint={t.deniedHint} steps={t.deniedSteps} />
          <Devices />
        </>
      )
      break
    case 'off':
      body = (
        <>
          <StatusCard icon={Bell} tone="muted" title={t.off} hint={t.offHint}>
            <button type="button" className={s.pushPrimary} onClick={handleEnable} disabled={push.busy}>
              <Bell size={16} aria-hidden /> {push.busy ? t.enabling : t.enable}
            </button>
          </StatusCard>
          <Devices />
        </>
      )
      break
    case 'on':
      body = (
        <>
          <StatusCard icon={BellRing} tone="on" title={t.on} hint={t.onHint}>
            <button
              type="button"
              className={s.pushSecondary}
              onClick={() => test.mutate()}
              disabled={test.isPending}
            >
              <Send size={16} aria-hidden /> {test.isPending ? t.testing : t.test}
            </button>
            <button type="button" className={s.pushSecondary} onClick={handleDisable} disabled={push.busy}>
              {push.busy ? t.disabling : t.disable}
            </button>
          </StatusCard>
          <Reminders />
          <Devices />
        </>
      )
      break
  }

  return (
    <SettingsSubpage title={tc.settings.notifications} description={tc.settings.notificationsSub}>
      {body}
    </SettingsSubpage>
  )
}
