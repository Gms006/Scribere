import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'
import { appName } from '@/lib/appConfig'

const LoginPage = () => {
  const { user, signIn, loading, error: authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/app" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      setError(signInError)
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="text-lg font-semibold text-ink-900">{appName}</div>
          <span className="text-sm text-ink-500">Stage 0 · Setup</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
          <div className="mb-6">
            <p className="text-sm font-medium text-brand-600">Bem-vindo de volta</p>
            <h1 className="text-3xl font-semibold text-ink-900">{appName}</h1>
            <p className="mt-2 text-sm text-ink-500">Acesse suas notas com foco e produtividade.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-ink-700">
              Email
              <input
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="voce@exemplo.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block text-sm text-ink-700">
              Senha
              <input
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button
              className="flex w-full items-center justify-center rounded-xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || loading}
              type="submit"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {(error || authError) && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
              {error ?? authError}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-ink-500">
            Ainda sem conta? <span className="text-ink-700">Stage 1</span> cuidará disso.
          </div>

          <div className="mt-4 text-center text-xs text-ink-400">
            Precisa de acesso?{' '}
            <Link className="font-medium text-ink-700" to="/login">
              Fale com o time.
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
