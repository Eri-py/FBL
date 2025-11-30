import { createContext, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { api } from '@/lib/axios'

export type User = {
  id: string
  username: string
  hasTeam: boolean
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUserTeam: (hasTeam: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const { data: user, isLoading: loading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/me')
        return {
          id: response.data.user.id,
          username: response.data.user.username,
          hasTeam: response.data.user.hasTeam || false,
        } as User
      } catch (error) {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry if user is not authenticated
  })

  const login = async (username: string, password: string): Promise<void> => {
    const response = await api.post('/auth/login', { username, password })
    const userData = {
      id: response.data.user.id,
      username: response.data.user.username,
      hasTeam: response.data.user.hasTeam || false,
    }
    // Update the query cache with the new user data
    queryClient.setQueryData(['auth', 'me'], userData)
  }

  const signup = async (username: string, password: string): Promise<void> => {
    const response = await api.post('/auth/signup', { username, password })
    const userData = {
      id: response.data.user.id,
      username: response.data.user.username,
      hasTeam: response.data.user.hasTeam || false,
    }
    // Update the query cache with the new user data
    queryClient.setQueryData(['auth', 'me'], userData)
  }

  const logout = async (): Promise<void> => {
    await api.post('/auth/logout')
    // Clear the auth cache
    queryClient.setQueryData(['auth', 'me'], null)
  }

  const setUserTeam = (hasTeam: boolean) => {
    if (user) {
      // Update the query cache with the new hasTeam value
      queryClient.setQueryData(['auth', 'me'], { ...user, hasTeam })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading,
        login,
        signup,
        logout,
        setUserTeam,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
