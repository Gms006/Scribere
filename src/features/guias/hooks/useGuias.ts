import { useCallback } from 'react'

import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import type { GuiaProcesso, TipoProcesso } from '@/features/guias/types'

const MOCK_TIPOS_PROCESSO: TipoProcesso[] = [
  { id: 'tipo-dev-1', nome: 'Alvara de Funcionamento', categoria: 'Licenciamento' },
  { id: 'tipo-dev-2', nome: 'Licenca Sanitaria', categoria: 'Vigilancia Sanitaria' },
  { id: 'tipo-dev-3', nome: 'Inscricao Municipal (ISS)', categoria: 'Tributario' },
]

const MOCK_GUIAS: GuiaProcesso[] = [
  {
    id: 'guia-dev-1',
    user_id: 'dev-user',
    municipio_id: 'municipio-dev-1',
    tipo_id: 'tipo-dev-1',
    como_funciona: 'Fluxo geral: protocolo, analise e vistoria final.',
    documentos: ['Contrato social', 'Comprovante de endereco'],
    etapas: ['Protocolar pedido', 'Aguardar analise', 'Retirar licenca'],
    dependencia_tipo_ids: ['tipo-dev-2'],
    prazo_estimado: '30 a 60 dias',
    custo_estimado: 250,
    orgao_responsavel: 'Secretaria de Fazenda',
    contato_orgao: '(62) 3310-0000',
    validade_tipo: 'Definitivo',
    observacoes: 'Levar documentos originais para conferencia.',
    atualizado_em: new Date().toISOString(),
    created_at: new Date().toISOString(),
    tipos_processo: MOCK_TIPOS_PROCESSO[0],
  },
]

type FiltrosGuia = {
  municipio_id?: string
  tipo_id?: string
}

const sanitizeList = (items?: string[]) => (items ?? []).map((item) => item.trim()).filter(Boolean)
const sanitizeIdList = (items?: string[]) =>
  [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))]
const normalizeValidadeTipo = (
  value?: GuiaProcesso['validade_tipo'],
): 'Definitivo' | 'Condicionado' => (value === 'Condicionado' ? 'Condicionado' : 'Definitivo')

export const useGuias = () => {
  const { user } = useAuth()

  const listarTiposProcesso = useCallback(async () => {
    if (!supabase) {
      return MOCK_TIPOS_PROCESSO
    }

    const { data, error } = await supabase
      .from('tipos_processo')
      .select('*')
      .order('nome', { ascending: true })

    if (error) throw new Error(error.message)
    return data as TipoProcesso[]
  }, [])

  const listarGuias = useCallback(
    async (filtros?: FiltrosGuia) => {
      if (!user) return []

      if (!supabase) {
        return MOCK_GUIAS.filter((guia) => {
          if (guia.user_id !== user.id) return false
          if (filtros?.municipio_id && guia.municipio_id !== filtros.municipio_id) return false
          if (filtros?.tipo_id && guia.tipo_id !== filtros.tipo_id) return false
          return true
        }).sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em))
      }

      let query = supabase
        .from('guias_processo')
        .select('*, municipios(*), tipos_processo(*)')
        .eq('user_id', user.id)
        .order('atualizado_em', { ascending: false })

      if (filtros?.municipio_id) query = query.eq('municipio_id', filtros.municipio_id)
      if (filtros?.tipo_id) query = query.eq('tipo_id', filtros.tipo_id)

      const { data, error } = await query
      if (error) throw new Error(error.message)
      return data as GuiaProcesso[]
    },
    [user]
  )

  const buscarGuia = useCallback(
    async (municipioId: string, tipoId: string) => {
      if (!user) return null

      if (!supabase) {
        return (
          MOCK_GUIAS.find(
            (guia) =>
              guia.user_id === user.id &&
              guia.municipio_id === municipioId &&
              guia.tipo_id === tipoId
          ) ?? null
        )
      }

      const { data, error } = await supabase
        .from('guias_processo')
        .select('*, municipios(*), tipos_processo(*)')
        .eq('user_id', user.id)
        .eq('municipio_id', municipioId)
        .eq('tipo_id', tipoId)
        .maybeSingle()

      if (error) throw new Error(error.message)
      return (data as GuiaProcesso | null) ?? null
    },
    [user]
  )

  const buscarGuiaPorId = useCallback(
    async (id: string) => {
      if (!user) return null

      if (!supabase) {
        return MOCK_GUIAS.find((guia) => guia.user_id === user.id && guia.id === id) ?? null
      }

      const { data, error } = await supabase
        .from('guias_processo')
        .select('*, municipios(*), tipos_processo(*)')
        .eq('user_id', user.id)
        .eq('id', id)
        .maybeSingle()

      if (error) throw new Error(error.message)
      return (data as GuiaProcesso | null) ?? null
    },
    [user]
  )

  const salvarGuia = useCallback(
    async (dados: Partial<GuiaProcesso>) => {
      if (!user) throw new Error('Usuário não autenticado.')
      if (!dados.municipio_id || !dados.tipo_id) {
        throw new Error('Município e tipo de processo são obrigatórios.')
      }

      const validadeTipo = normalizeValidadeTipo(dados.validade_tipo)
      const payload = {
        id: dados.id,
        user_id: user.id,
        municipio_id: dados.municipio_id,
        tipo_id: dados.tipo_id,
        como_funciona: dados.como_funciona?.trim() || null,
        documentos: sanitizeList(dados.documentos),
        etapas: sanitizeList(dados.etapas),
        dependencia_tipo_ids: sanitizeIdList(dados.dependencia_tipo_ids).filter(
          (tipo) => tipo !== dados.tipo_id,
        ),
        prazo_estimado: dados.prazo_estimado?.trim() || null,
        custo_estimado: dados.custo_estimado ?? null,
        orgao_responsavel: dados.orgao_responsavel?.trim() || null,
        contato_orgao: dados.contato_orgao?.trim() || null,
        validade_tipo: validadeTipo,
        validade_prazo_anos:
          validadeTipo === 'Condicionado' ? (dados.validade_prazo_anos ?? null) : null,
        observacoes: dados.observacoes?.trim() || null,
        atualizado_em: new Date().toISOString(),
      }

      if (!supabase) {
        const now = new Date().toISOString()
        const existingIdx = MOCK_GUIAS.findIndex(
          (guia) =>
            guia.user_id === user.id &&
            guia.municipio_id === payload.municipio_id &&
            guia.tipo_id === payload.tipo_id
        )

        if (existingIdx >= 0) {
          MOCK_GUIAS[existingIdx] = {
            ...MOCK_GUIAS[existingIdx],
            ...payload,
            id: MOCK_GUIAS[existingIdx].id,
            created_at: MOCK_GUIAS[existingIdx].created_at,
            como_funciona: payload.como_funciona ?? undefined,
            prazo_estimado: payload.prazo_estimado ?? undefined,
            dependencia_tipo_ids: payload.dependencia_tipo_ids,
            contato_orgao: payload.contato_orgao ?? undefined,
            orgao_responsavel: payload.orgao_responsavel ?? undefined,
            validade_tipo: payload.validade_tipo,
            validade_prazo_anos: payload.validade_prazo_anos ?? undefined,
            observacoes: payload.observacoes ?? undefined,
            custo_estimado: payload.custo_estimado ?? undefined,
            atualizado_em: now,
          }
          return MOCK_GUIAS[existingIdx]
        }

        const novo: GuiaProcesso = {
          id: `guia-${Date.now()}`,
          user_id: user.id,
          municipio_id: payload.municipio_id,
          tipo_id: payload.tipo_id,
          como_funciona: payload.como_funciona ?? undefined,
          documentos: payload.documentos,
          etapas: payload.etapas,
          dependencia_tipo_ids: payload.dependencia_tipo_ids,
          prazo_estimado: payload.prazo_estimado ?? undefined,
          custo_estimado: payload.custo_estimado ?? undefined,
          orgao_responsavel: payload.orgao_responsavel ?? undefined,
          contato_orgao: payload.contato_orgao ?? undefined,
          validade_tipo: payload.validade_tipo,
          validade_prazo_anos: payload.validade_prazo_anos ?? undefined,
          observacoes: payload.observacoes ?? undefined,
          atualizado_em: now,
          created_at: now,
        }
        MOCK_GUIAS.unshift(novo)
        return novo
      }

      const { data, error } = await supabase
        .from('guias_processo')
        .upsert(payload, {
          onConflict: 'user_id,municipio_id,tipo_id',
        })
        .select('*, municipios(*), tipos_processo(*)')
        .single()

      if (error) throw new Error(error.message)
      return data as GuiaProcesso
    },
    [user]
  )

  const excluirGuia = useCallback(async (id: string) => {
    if (!supabase) {
      const idx = MOCK_GUIAS.findIndex((item) => item.id === id)
      if (idx >= 0) MOCK_GUIAS.splice(idx, 1)
      return
    }

    const { error } = await supabase.from('guias_processo').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  return {
    listarTiposProcesso,
    listarGuias,
    buscarGuia,
    buscarGuiaPorId,
    salvarGuia,
    excluirGuia,
  }
}
