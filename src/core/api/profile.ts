import api from './axios'

export interface Profile {
  id: string
  username: string
  displayName: string | null
  createdAt: string
}

export async function fetchProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>('/profile')
  return data
}

/** A blank name clears it; the server trims. */
export async function updateProfile(dto: { displayName: string }): Promise<Profile> {
  const { data } = await api.patch<Profile>('/profile', dto)
  return data
}
