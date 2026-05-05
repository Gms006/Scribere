import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Toast from '@/components/Toast'
import MunicipioForm from '@/features/guias/components/MunicipioForm'
import { useGuias } from '@/features/guias/hooks/useGuias'
import { useMunicipios } from '@/features/guias/hooks/useMunicipios'
import type { GuiaProcesso, Municipio, TipoProcesso } from '@/features/guias/types'

const GuiaForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const { listarTiposProcesso, buscarGuia, buscarGuiaPorId, salvarGuia } = useGuias()
  const { listarMunicipios } = useMunicipios()

  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [tipos, setTipos] = useState<TipoProcesso[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showMunicipioModal, setShowMunicipioModal] = useState(false)

  const [guiaId, setGuiaId] = useState<string | undefined>(id)
  const [municipioId, setMunicipioId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [comoFunciona, setComoFunciona] = useState('')
  const [documentos, setDocumentos] = useState<string[]>([])
  const [documentoDraft, setDocumentoDraft] = useState('')
  const [etapas, setEtapas] = useState<string[]>([])
  const [etapaDraft, setEtapaDraft] = useState('')
  const [dependenciaTipoIds, setDependenciaTipoIds] = useState<string[]>([])
  const [prazoEstimado, setPrazoEstimado] = useState('')
  const [custoEstimado, setCustoEstimado] = useState('')
  const [orgaoResponsavel, setOrgaoResponsavel] = useState('')
  const [contatoOrgao, setContatoOrgao] = useState('')
  const [validadeTipo, setValidadeTipo] = useState<'Definitivo' | 'Condicionado'>('Definitivo')
  const [validadePrazoAnos, setValidadePrazoAnos] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const autoLoadedPairRef = useRef<string | null>(null)
  const isEditingByRoute = Boolean(id)

  const hydrateForm = (guia: GuiaProcesso) => {
    setGuiaId(guia.id)
    setMunicipioId(guia.municipio_id)
    setTipoId(guia.tipo_id)
    setComoFunciona(guia.como_funciona ?? '')
    setDocumentos(guia.documentos ?? [])
    setEtapas(guia.etapas ?? [])
    setDependenciaTipoIds(guia.dependencia_tipo_ids ?? [])
    setPrazoEstimado(guia.prazo_estimado ?? '')
    setCustoEstimado(typeof guia.custo_estimado === 'number' ? guia.custo_estimado.toString() : '')
    setOrgaoResponsavel(guia.orgao_responsavel ?? '')
    setContatoOrgao(guia.contato_orgao ?? '')
    setValidadeTipo(guia.validade_tipo === 'Condicionado' ? 'Condicionado' : 'Definitivo')
    setValidadePrazoAnos(
      typeof guia.validade_prazo_anos === 'number' ? String(guia.validade_prazo_anos) : '',
    )
    setObservacoes(guia.observacoes ?? '')
  }

  useEffect(() => {
    const loadBase = async () => {
      try {
        setLoading(true)
        const [listaMunicipios, listaTipos] = await Promise.all([
          listarMunicipios(),
          listarTiposProcesso(),
        ])
        setMunicipios(listaMunicipios)
        setTipos(listaTipos)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar listas.')
      } finally {
        setLoading(false)
      }
    }

    loadBase()
  }, [listarMunicipios, listarTiposProcesso])

  useEffect(() => {
    if (!id) return

    const loadById = async () => {
      try {
        setLoading(true)
        const guia = await buscarGuiaPorId(id)
        if (!guia) {
          setError('Guia não encontrado.')
          return
        }
        hydrateForm(guia)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar guia.')
      } finally {
        setLoading(false)
      }
    }

    loadById()
  }, [buscarGuiaPorId, id])

  useEffect(() => {
    if (isEditingByRoute) return
    if (!municipioId || !tipoId) return

    const pairKey = `${municipioId}:${tipoId}`
    if (autoLoadedPairRef.current === pairKey) return

    const loadExisting = async () => {
      try {
        const existente = await buscarGuia(municipioId, tipoId)
        autoLoadedPairRef.current = pairKey
        if (existente) {
          hydrateForm(existente)
          setToast('Guia existente carregado para edição.')
        } else {
          setGuiaId(undefined)
          setComoFunciona('')
          setDocumentos([])
          setEtapas([])
          setDependenciaTipoIds([])
          setPrazoEstimado('')
          setCustoEstimado('')
          setOrgaoResponsavel('')
          setContatoOrgao('')
          setValidadeTipo('Definitivo')
          setValidadePrazoAnos('')
          setObservacoes('')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao verificar guia existente.')
      }
    }

    loadExisting()
  }, [buscarGuia, isEditingByRoute, municipioId, tipoId])

  useEffect(() => {
    if (!tipoId) return
    setDependenciaTipoIds((prev) => prev.filter((item) => item !== tipoId))
  }, [tipoId])

  const addDocumento = () => {
    if (!documentoDraft.trim()) return
    setDocumentos((prev) => [...prev, documentoDraft.trim()])
    setDocumentoDraft('')
  }

  const addEtapa = () => {
    if (!etapaDraft.trim()) return
    setEtapas((prev) => [...prev, etapaDraft.trim()])
    setEtapaDraft('')
  }

  const moveEtapa = (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= etapas.length) return
    setEtapas((prev) => {
      const arr = [...prev]
      ;[arr[index], arr[next]] = [arr[next], arr[index]]
      return arr
    })
  }

  const handleSave = async () => {
    if (!municipioId || !tipoId) {
      setError('Selecione município e tipo de processo.')
      return
    }
    if (validadeTipo === 'Condicionado' && (!validadePrazoAnos || Number(validadePrazoAnos) <= 0)) {
      setError('Informe o prazo de validade em anos para guias condicionadas.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const saved = await salvarGuia({
        id: guiaId,
        municipio_id: municipioId,
        tipo_id: tipoId,
        como_funciona: comoFunciona,
        documentos,
        etapas,
        dependencia_tipo_ids: dependenciaTipoIds.filter((item) => item !== tipoId),
        prazo_estimado: prazoEstimado,
        custo_estimado: custoEstimado ? Number(custoEstimado) : undefined,
        orgao_responsavel: orgaoResponsavel,
        contato_orgao: contatoOrgao,
        validade_tipo: validadeTipo,
        validade_prazo_anos:
          validadeTipo === 'Condicionado' ? Number(validadePrazoAnos) : undefined,
        observacoes,
      })
      setToast('Guia salvo com sucesso.')
      window.setTimeout(() => navigate(`/guias/${saved.id}`), 350)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar guia.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-ink-500">Carregando formulário...</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {guiaId ? 'Editar guia' : 'Novo guia'}
            </p>
            <h2 className="text-lg font-semibold text-ink-900">Guia de processo municipal</h2>
          </div>
          <Link
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-slate-50"
            to={guiaId ? `/guias/${guiaId}` : '/guias'}
          >
            Cancelar
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="block text-xs text-ink-600">
            Município
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={municipioId}
              onChange={(event) => setMunicipioId(event.target.value)}
            >
              <option value="">Selecione</option>
              {municipios.map((municipio) => (
                <option key={municipio.id} value={municipio.id}>
                  {municipio.nome}/{municipio.uf}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs text-ink-600">
            Tipo de processo
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={tipoId}
              onChange={(event) => setTipoId(event.target.value)}
            >
              <option value="">Selecione</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </label>

          <button
            className="h-fit self-end rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-slate-50"
            onClick={() => setShowMunicipioModal(true)}
            type="button"
          >
            Novo município
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Dependências do processo
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Marque processos que precisam estar finalizados antes deste.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {tipos
              .filter((tipo) => tipo.id !== tipoId)
              .map((tipo) => {
                const checked = dependenciaTipoIds.includes(tipo.id)
                return (
                  <label
                    key={tipo.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-ink-700"
                  >
                    <input
                      checked={checked}
                      type="checkbox"
                      onChange={(event) => {
                        const isChecked = event.target.checked
                        setDependenciaTipoIds((prev) => {
                          if (isChecked) return [...new Set([...prev, tipo.id])]
                          return prev.filter((id) => id !== tipo.id)
                        })
                      }}
                    />
                    <span>{tipo.nome}</span>
                  </label>
                )
              })}
          </div>
        </div>

        <label className="mt-4 block text-xs text-ink-600">
          Como funciona
          <textarea
            className="mt-1 min-h-36 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Descreva o fluxo e observações em markdown."
            value={comoFunciona}
            onChange={(event) => setComoFunciona(event.target.value)}
          />
        </label>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-ink-600">Documentos necessários</p>
            <div className="mt-1 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                value={documentoDraft}
                onChange={(event) => setDocumentoDraft(event.target.value)}
              />
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-slate-50"
                onClick={addDocumento}
                type="button"
              >
                Adicionar
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {documentos.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs text-ink-700"
                >
                  <span>{item}</span>
                  <button
                    className="text-ink-400 hover:text-red-500"
                    onClick={() => setDocumentos((prev) => prev.filter((_, i) => i !== index))}
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-ink-600">Etapas</p>
            <div className="mt-1 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                value={etapaDraft}
                onChange={(event) => setEtapaDraft(event.target.value)}
              />
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-slate-50"
                onClick={addEtapa}
                type="button"
              >
                Adicionar
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {etapas.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-ink-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{item}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-ink-400 hover:text-ink-700"
                        onClick={() => moveEtapa(index, -1)}
                        type="button"
                      >
                        Subir
                      </button>
                      <button
                        className="text-ink-400 hover:text-ink-700"
                        onClick={() => moveEtapa(index, 1)}
                        type="button"
                      >
                        Descer
                      </button>
                      <button
                        className="text-ink-400 hover:text-red-500"
                        onClick={() => setEtapas((prev) => prev.filter((_, i) => i !== index))}
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block text-xs text-ink-600">
            Prazo estimado
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={prazoEstimado}
              onChange={(event) => setPrazoEstimado(event.target.value)}
            />
          </label>

          <label className="block text-xs text-ink-600">
            Custo estimado
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              min="0"
              step="0.01"
              type="number"
              value={custoEstimado}
              onChange={(event) => setCustoEstimado(event.target.value)}
            />
          </label>

          <label className="block text-xs text-ink-600">
            Órgão responsável
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={orgaoResponsavel}
              onChange={(event) => setOrgaoResponsavel(event.target.value)}
            />
          </label>

          <label className="block text-xs text-ink-600">
            Contato do órgão
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={contatoOrgao}
              onChange={(event) => setContatoOrgao(event.target.value)}
            />
          </label>

          <label className="block text-xs text-ink-600">
            Validade
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={validadeTipo}
              onChange={(event) =>
                setValidadeTipo(event.target.value as 'Definitivo' | 'Condicionado')
              }
            >
              <option value="Definitivo">Definitivo</option>
              <option value="Condicionado">Condicionado</option>
            </select>
          </label>

          {validadeTipo === 'Condicionado' && (
            <label className="block text-xs text-ink-600">
              Prazo de validade (anos)
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                min="1"
                step="1"
                type="number"
                value={validadePrazoAnos}
                onChange={(event) => setValidadePrazoAnos(event.target.value)}
              />
            </label>
          )}

          <label className="block text-xs text-ink-600">
            Observações
            <textarea
              className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            className="rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-50"
            disabled={saving}
            onClick={handleSave}
            type="button"
          >
            {saving ? 'Salvando...' : 'Salvar guia'}
          </button>
        </div>
      </div>

      <MunicipioForm
        municipio={null}
        onClose={() => setShowMunicipioModal(false)}
        onSaved={(novoMunicipio) => {
          setMunicipios((prev) =>
            [...prev, novoMunicipio].sort((a, b) => a.nome.localeCompare(b.nome))
          )
          setMunicipioId(novoMunicipio.id)
          setToast('Município cadastrado.')
        }}
        open={showMunicipioModal}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  )
}

export default GuiaForm
