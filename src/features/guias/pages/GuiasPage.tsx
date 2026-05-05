import { Link } from 'react-router-dom'

import GuiasList from '@/features/guias/components/GuiasList'

const GuiasPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-ink-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-full items-center justify-between px-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Scribere</p>
            <p className="text-lg font-semibold text-ink-900">Guias de processo</p>
          </div>
          <Link
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-slate-100"
            to="/app"
          >
            Voltar ao workspace
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-full px-4 py-8">
        <GuiasList />
      </main>
    </div>
  )
}

export default GuiasPage
