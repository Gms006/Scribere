import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Mock user for development mode
const DEV_USER: User = {
  id: 'dev-user',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'dev@scribere.local',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'dev', providers: ['dev'] },
  user_metadata: { name: 'Dev User' },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(isSupabaseConfigured ? null : null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Development mode with mock user
      setUser(DEV_USER)
      setSession(null)
      setError(null)
      setLoading(false)
      return undefined
    }

    const client = supabase

    const bootstrap = async () => {
      try {
        const { data, error: sessionError } = await client.auth.getSession()
        if (sessionError) {
          setError(sessionError.message)
        }
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar sessão.')
      } finally {
        setLoading(false)
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      error,
      signIn: async (email, password) => {
        if (!supabase) {
          return { error: 'Supabase não configurado.' }
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        return { error: signInError?.message ?? null }
      },
      signOut: async () => {
        if (!supabase) {
          return
        }
        await supabase.auth.signOut()
      },
    }),
    [error, loading, session, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
