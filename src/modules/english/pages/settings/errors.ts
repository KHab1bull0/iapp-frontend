interface ApiError {
  response?: { data?: { message?: string | string[] } }
}

/** The API's message (first one if several), or the fallback. */
export function apiMessage(err: unknown, fallback: string): string {
  const m = (err as ApiError)?.response?.data?.message
  return (Array.isArray(m) ? m[0] : m) ?? fallback
}
