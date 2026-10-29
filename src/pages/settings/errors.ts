interface ApiError {
  response?: { data?: { message?: string | string[] } }
}

/** The first validation message the API sent back, or a generic one. */
export function apiErrorMessage(err: unknown): string {
  const msg = (err as ApiError)?.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  return msg ?? 'Something went wrong'
}
