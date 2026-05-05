import { useEffect, useState } from 'react'

import Toast from '@/components/Toast'
import MunicipioForm from '@/features/guias/components/MunicipioForm'
import { useMunicipios } from '@/features/guias/hooks/useMunicipios'
import type { Municipio } from '@/features/guias/types'

type MunicipiosManagerProps = {
  open: boolean
  onClose: () => void
  onChanged?: (municipios: Municipio[]) => void
}

const MunicipiosManager = ({ open, onClose, onChanged }: MunicipiosManagerProps) => {
  const { listarMunicipios, excluirMunicipio } = useMunicipios()

  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingMunicipio, setEditingMunicipio] = useState<Municipio | null>(null)

  useEffect(() => {
    if (!open) return

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await listarMunicipios()
        setMunicipios(data)
        onChanged?.(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar municípios.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [listarMunicipios, onChanged, open])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">Municípios cadastrados</h3>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-slate-50"
                onClick={() => {
                  setEditingMunicipio(null)
                  setFormOpen(true)
                }}
                type="button"
              >
                Novo município
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-slate-50"
                onClick={onClose}
                type="button"
              >
                Fechar
              </button>
            </div>
          </div>

          <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {loading && <p className="text-xs text-ink-400">Carregando municípios...</p>}
            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}
            {!loading && !error && municipios.length === 0 && (
              <p className="text-xs text-ink-500">Nenhum município cadastrado.</p>
            )}

            {municipios.map((municipio) => (
              <div
                key={municipio.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-800">{municipio.nome}</p>
                  <p className="text-xs text-ink-500">
                    {municipio.uf}
                    {municipio.site_prefeitura ? ` · ${municipio.site_prefeitura}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs font-semibold text-ink-500 hover:text-ink-800"
                    onClick={() => {
                      setEditingMunicipio(municipio)
                      setFormOpen(true)
                    }}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="text-xs font-semibold text-red-500 hover:text-red-700"
                    onClick={async () => {
                      try {
                        await excluirMunicipio(municipio.id)
                        setMunicipios((prev) => {
                          const next = prev.filter((item) => item.id !== municipio.id)
                          onChanged?.(next)
                          return next
                        })
                        setToast('Município excluído.')
                      } catch (err) {
                        setToast(err instanceof Error ? err.message : 'Erro ao excluir município.')
                      }
                    }}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MunicipioForm
        municipio={editingMunicipio}
        onClose={() => setFormOpen(false)}
        onSaved={(salvo) => {
          setMunicipios((prev) => {
            const idx = prev.findIndex((item) => item.id === salvo.id)
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = salvo
              const sorted = next.sort((a, b) => a.nome.localeCompare(b.nome))
              onChanged?.(sorted)
              return sorted
            }
            const next = [...prev, salvo].sort((a, b) => a.nome.localeCompare(b.nome))
            onChanged?.(next)
            return next
          })
          setToast(editingMunicipio ? 'Município atualizado.' : 'Município criado.')
          setFormOpen(false)
          setEditingMunicipio(null)
        }}
        open={formOpen}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  )
}

export default MunicipiosManager
