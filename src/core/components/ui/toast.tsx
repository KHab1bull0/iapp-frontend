import clsx from 'clsx'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import s from './toast.module.scss'

interface ToastItem {
  id: string
  message: string
  tone: 'success' | 'error'
}

let _addToast: ((msg: string, tone?: 'success' | 'error') => void) | null = null

export function toast(message: string, tone: 'success' | 'error' = 'success') {
  _addToast?.(message, tone)
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    _addToast = (msg, tone = 'success') => {
      const id = Math.random().toString(36).slice(2)
      setItems((prev) => [...prev, { id, message: msg, tone }])
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 2800)
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
        </div>
      ))}
    </div>
  )
}
