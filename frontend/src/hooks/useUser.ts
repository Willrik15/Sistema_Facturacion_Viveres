import { useAuthStore } from './useAuth'

export const useUser = () => {
  const { user, isAuthenticated } = useAuthStore()
  return { user, isAuthenticated }
}
