import clsx from 'clsx'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import s from './toast.module.scss'

type Tone = 'success' | 'error'

/** An optional button on the toast, e.g. Undo. */
export interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: string
  message: string
  tone: Tone
  action?: ToastAction
}

let _addToast: ((msg: string, tone: Tone, action?: ToastAction) => void) | null = null

export function toast(message: string, tone: Tone = 'success', action?: ToastAction) {
  _addToast?.(message, tone, action)
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    _addToast = (msg, tone, action) => {
      const id = Math.random().toString(36).slice(2)
      setItems((prev) => [...prev, { id, message: msg, tone, action }])
      // A toast with an action stays a little longer, so there is time to tap it.
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), action ? 5000 : 2800)
    }
    return () => { _addToast = null }
  }, [])

  return (
    <div className={s.toastHost} aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={clsx(s.toast, t.tone === 'success' ? s.toastSuccess : s.toastError)}>
          <span className={s.toastIc}>
            {t.tone === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
          </span>
          <span className={s.toastMsg}>{t.message}</span>
          {t.action && (
            <button
              className={s.toastAction}
              onClick={() => {
                t.action!.onClick()
                setItems((prev) => prev.filter((x) => x.id !== t.id))
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
