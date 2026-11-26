import type { TextareaHTMLAttributes } from 'react'
import { useAutosize } from '@/core/hooks/useAutosize'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'rows'> & {
  value: string
  onChange: (value: string) => void
  /** Keep line breaks: Enter adds a line, Ctrl/Cmd+Enter submits the form. */
  multiline?: boolean
}

/**
 * A text field that wraps instead of hiding what doesn't fit: a one-row
 * textarea that grows with its text (useAutosize). By default it holds one
 * line: pasted line breaks become spaces, and Enter submits the form like a
 * plain input would. `multiline` keeps the user's line breaks instead.
 */
export function GrowingInput({ value, onChange, onKeyDown, multiline = false, ...rest }: Props) {
  const ref = useAutosize(value)
  return (
    <textarea
      {...rest}
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(multiline ? e.target.value : e.target.value.replace(/\s*\n+\s*/g, ' '))}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || e.key !== 'Enter' || e.nativeEvent.isComposing) return
        const submits = multiline ? e.ctrlKey || e.metaKey : !e.shiftKey
        if (submits) {
          e.preventDefault()
          e.currentTarget.form?.requestSubmit()
        }
      }}
    />
  )
}
