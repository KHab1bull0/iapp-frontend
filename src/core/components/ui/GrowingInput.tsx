import type { TextareaHTMLAttributes } from 'react'
import { useAutosize } from '@/core/hooks/useAutosize'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'rows'> & {
  value: string
  onChange: (value: string) => void
}

/**
 * A one-line text field that wraps instead of hiding what doesn't fit: a
 * one-row textarea that grows with its text (useAutosize). It still holds
 * one line: pasted line breaks become spaces, and Enter submits the form
 * like a plain input would.
 */
export function GrowingInput({ value, onChange, onKeyDown, ...rest }: Props) {
  const ref = useAutosize(value)
  return (
    <textarea
      {...rest}
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\s*\n+\s*/g, ' '))}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault()
          e.currentTarget.form?.requestSubmit()
        }
      }}
    />
  )
}
