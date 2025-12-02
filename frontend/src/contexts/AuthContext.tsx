import { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me')
        setUser({
          id: response.data.user.id,
          username: response.data.user.username,
          hasTeam: response.data.user.hasTeam || false,
        })
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<void> => {
    const response = await api.post('/auth/login', { username, password })
    const userData = {
      id: response.data.user.id,
      username: response.data.user.username,
      hasTeam: response.data.user.hasTeam || false,
    }
    setUser(userData)
  }

  const signup = async (username: string, password: string): Promise<void> => {
    const response = await api.post('/auth/signup', { username, password })
    const userData = {
      id: response.data.user.id,
      username: response.data.user.username,
      hasTeam: response.data.user.hasTeam || false,
    }
    setUser(userData)
  }

  const logout = async (): Promise<void> => {
    await api.post('/auth/logout')
    setUser(null)
    // Clear all queries
    queryClient.removeQueries({ queryKey: ['myTeam'] })
    queryClient.removeQueries({ queryKey: ['leaderboard'] })
  }

  const setUserTeam = (hasTeam: boolean) => {
    if (user) {
      setUser({ ...user, hasTeam })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
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
