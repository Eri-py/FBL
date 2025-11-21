import { createContext, useContext, useEffect, useState } from 'react'
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in by calling /me endpoint
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me')
        setUser({
          id: response.data.user.id,
          username: response.data.user.username,
          hasTeam: false, // TODO: This will come from database later
        })
      } catch (error) {
        // Not logged in or token expired
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<void> => {
    const response = await api.post('/auth/login', { username, password })
    setUser({
      id: response.data.user.id,
      username: response.data.user.username,
      hasTeam: false, // TODO: This will come from database later
    })
  }

  const signup = async (username: string, password: string): Promise<void> => {
    const response = await api.post('/auth/signup', { username, password })
    setUser({
      id: response.data.user.id,
      username: response.data.user.username,
      hasTeam: false, // TODO: This will come from database later
    })
  }

  const logout = async (): Promise<void> => {
    await api.post('/auth/logout')
    setUser(null)
  }

  const setUserTeam = (hasTeam: boolean) => {
    if (user) {
      setUser({ ...user, hasTeam })
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, setUserTeam }}
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
