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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Supabase não configurado. Verifique o .env.local.'
  )

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined
    }

    const client = supabase

    const bootstrap = async () => {
      const { data, error: sessionError } = await client.auth.getSession()
      if (sessionError) {
        setError(sessionError.message)
      }
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
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
