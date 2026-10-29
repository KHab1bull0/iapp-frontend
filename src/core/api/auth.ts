import api from './axios'

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return api.patch('/auth/change-password', { currentPassword, newPassword })
}
