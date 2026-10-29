import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '@/core/api/profile'
import { useAuth } from '@/core/contexts/AuthContext'

/** Keyed by user id so a different sign-in on the same device never sees the last one's name. */
export const profileKey = (userId: string | undefined) => ['profile', userId] as const

export function useProfile() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: profileKey(user?.id),
    queryFn: fetchProfile,
    enabled: !!user,
  })
  // The name to show: the chosen one, else the username from the token.
  const displayName = query.data?.displayName || user?.username || ''
  return { ...query, displayName }
}
