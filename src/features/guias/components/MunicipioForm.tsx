import { useEffect, useState } from 'react'

import { useMunicipios } from '@/features/guias/hooks/useMunicipios'
import type { Municipio } from '@/features/guias/types'

type MunicipioFormProps = {
  open: boolean
  onClose: () => void
  onSaved: (municipio: Municipio) => void
  municipio?: Municipio | null
}

const MunicipioForm = ({ open, onClose, onSaved, municipio }: MunicipioFormProps) => {
  const { criarMunicipio, atualizarMunicipio } = useMunicipios()

  const [nome, setNome] = useState(municipio?.nome ?? '')
  const [uf, setUf] = useState(municipio?.uf ?? '')
  const [sitePrefeitura, setSitePrefeitura] = useState(municipio?.site_prefeitura ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setNome(municipio?.nome ?? '')
    setUf(municipio?.uf ?? '')
    setSitePrefeitura(municipio?.site_prefeitura ?? '')
    setError(null)
  }, [municipio, open])

  if (!open) return null

  const reset = () => {
    setNome('')
    setUf('')
    setSitePrefeitura('')
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!nome.trim() || !uf.trim()) {
      setError('Nome e UF são obrigatórios.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        nome: nome.trim(),
        uf: uf.trim().toUpperCase().slice(0, 2),
        site_prefeitura: sitePrefeitura.trim() || undefined,
      }

      const salvo = municipio
        ? await atualizarMunicipio(municipio.id, payload)
        : await criarMunicipio(payload)

      onSaved(salvo)
      reset()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar município.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-ink-900">
          {municipio ? 'Editar município' : 'Novo município'}
        </h3>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-4 gap-3">
            <label className="col-span-3 text-xs text-ink-600">
              Nome
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
              />
            </label>
            <label className="text-xs text-ink-600">
              UF
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                maxLength={2}
                value={uf}
                onChange={(event) => setUf(event.target.value)}
              />
            </label>
          </div>

          <label className="block text-xs text-ink-600">
            Site da prefeitura
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="https://..."
              value={sitePrefeitura}
              onChange={(event) => setSitePrefeitura(event.target.value)}
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Salvando...' : municipio ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MunicipioForm
