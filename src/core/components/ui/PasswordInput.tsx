import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './PasswordInput.module.scss'

/**
 * A password field with a show/hide eye. Renders the input and the button
 * side by side, so it drops into an existing flex input wrapper.
 */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const t = useCoreT()
  const [shown, setShown] = useState(false)
  return (
    <>
      <input {...props} type={shown ? 'text' : 'password'} />
      <button
        type="button"
        className={s.toggle}
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? t.common.hidePassword : t.common.showPassword}
        aria-pressed={shown}
      >
        {shown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </>
  )
}
