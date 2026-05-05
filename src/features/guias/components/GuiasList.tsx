import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import GuiaCard from '@/features/guias/components/GuiaCard'
import MunicipiosManager from '@/features/guias/components/MunicipiosManager'
import { useGuias } from '@/features/guias/hooks/useGuias'
import { useMunicipios } from '@/features/guias/hooks/useMunicipios'
import type { GuiaProcesso, Municipio, TipoProcesso } from '@/features/guias/types'

const GuiasList = () => {
  const navigate = useNavigate()
  const { listarGuias, listarTiposProcesso } = useGuias()
  const { listarMunicipios } = useMunicipios()

  const [guias, setGuias] = useState<GuiaProcesso[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [tipos, setTipos] = useState<TipoProcesso[]>([])
  const [filtroMunicipioId, setFiltroMunicipioId] = useState('')
  const [filtroTipoId, setFiltroTipoId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMunicipiosManager, setShowMunicipiosManager] = useState(false)

  useEffect(() => {
    const loadBase = async () => {
      try {
        const [listaMunicipios, listaTipos] = await Promise.all([
          listarMunicipios(),
          listarTiposProcesso(),
        ])
        setMunicipios(listaMunicipios)
        setTipos(listaTipos)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados.')
      }
    }

    loadBase()
  }, [listarMunicipios, listarTiposProcesso])

  useEffect(() => {
    const loadGuias = async () => {
      try {
        setLoading(true)
        setError(null)
        const lista = await listarGuias({
          municipio_id: filtroMunicipioId || undefined,
          tipo_id: filtroTipoId || undefined,
        })
        setGuias(lista)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar guias.')
      } finally {
        setLoading(false)
      }
    }

    loadGuias()
  }, [filtroMunicipioId, filtroTipoId, listarGuias])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Guias</p>
          <h2 className="text-lg font-semibold text-ink-900">
            Repositório de processos municipais
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-slate-50"
            onClick={() => setShowMunicipiosManager(true)}
            type="button"
          >
            Municípios
          </button>
          <button
            className="rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-700"
            onClick={() => navigate('/guias/novo')}
            type="button"
          >
            Nova guia
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        <select
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-ink-700 focus:border-brand-500 focus:outline-none"
          value={filtroMunicipioId}
          onChange={(event) => setFiltroMunicipioId(event.target.value)}
        >
          <option value="">Todos os municípios</option>
          {municipios.map((municipio) => (
            <option key={municipio.id} value={municipio.id}>
              {municipio.nome}/{municipio.uf}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-ink-700 focus:border-brand-500 focus:outline-none"
          value={filtroTipoId}
          onChange={(event) => setFiltroTipoId(event.target.value)}
        >
          <option value="">Todos os tipos de processo</option>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        {loading && <p className="text-xs text-ink-400">Carregando guias...</p>}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}
        {!loading && !error && guias.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-ink-700">Nenhuma guia encontrada</p>
            <p className="mt-1 text-xs text-ink-500">
              Cadastre a primeira guia para gerir documentação, etapas e prazos do município.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {guias.map((guia) => (
            <GuiaCard key={guia.id} guia={guia} onClick={() => navigate(`/guias/${guia.id}`)} />
          ))}
        </div>
      </div>

      <MunicipiosManager
        onChanged={(lista) => setMunicipios(lista)}
        onClose={() => setShowMunicipiosManager(false)}
        open={showMunicipiosManager}
      />
    </div>
  )
}

export default GuiasList
