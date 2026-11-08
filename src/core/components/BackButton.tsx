import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCoreT } from '@/core/i18n/useCoreT'

/**
 * "‹ Back": to the page before, wherever that was (a module's tabs, the
 * app's Settings). Opened straight from a link, with nothing before it in
 * the app, it goes to `fallback` instead of leaving the app.
 */
export function BackButton({ fallback, className, label }: { fallback: string; className?: string; label?: string }) {
  const t = useCoreT()
  const navigate = useNavigate()
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate(fallback))
  return (
    <button type="button" className={className} onClick={back}>
      <ChevronLeft size={18} aria-hidden /> {label ?? t.common.back}
    </button>
  )
}
