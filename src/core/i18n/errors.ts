import { coreMessages } from './messages'
import type { Lang } from './lang'

interface ApiError {
  response?: { data?: { message?: string | string[] } }
}

type ErrorKey = keyof (typeof coreMessages)['uz']['errors']

/**
 * The user-facing text for an API error. The backend sends stable codes
 * ("errors.username_taken") for messages people see; anything else falls
 * back to a generic line rather than showing raw English.
 */
export function apiErrorText(err: unknown, lang: Lang, fallback?: string): string {
  const raw = (err as ApiError)?.response?.data?.message
  const code = Array.isArray(raw) ? raw[0] : raw
  const errors = coreMessages[lang].errors
  if (code && code in errors) return errors[code as ErrorKey]
  return fallback ?? errors.generic
}
