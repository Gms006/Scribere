import { useCallback } from 'react'

import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import type { Municipio } from '@/features/guias/types'

type MunicipioInsert = Omit<Municipio, 'id' | 'user_id' | 'created_at'>

const MOCK_MUNICIPIOS: Municipio[] = [
  {
    id: 'municipio-dev-1',
    user_id: 'dev-user',
    nome: 'Anapolis',
    uf: 'GO',
    site_prefeitura: 'https://www.anapolis.go.gov.br',
    created_at: new Date().toISOString(),
  },
]

export const useMunicipios = () => {
  const { user } = useAuth()

  const listarMunicipios = useCallback(async () => {
    if (!user) return []

    if (!supabase) {
      return MOCK_MUNICIPIOS.filter((item) => item.user_id === user.id).sort((a, b) =>
        a.nome.localeCompare(b.nome)
      )
    }

    const { data, error } = await supabase
      .from('municipios')
      .select('*')
      .eq('user_id', user.id)
      .order('nome', { ascending: true })

    if (error) throw new Error(error.message)
    return data as Municipio[]
  }, [user])

  const criarMunicipio = useCallback(
    async (dados: MunicipioInsert) => {
      if (!user) throw new Error('Usuário não autenticado.')

      if (!supabase) {
        const novo: Municipio = {
          id: `municipio-${Date.now()}`,
          user_id: user.id,
          ...dados,
          created_at: new Date().toISOString(),
        }
        MOCK_MUNICIPIOS.push(novo)
        return novo
      }

      const { data, error } = await supabase
        .from('municipios')
        .insert({
          ...dados,
          user_id: user.id,
        })
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      return data as Municipio
    },
    [user]
  )

  const excluirMunicipio = useCallback(async (id: string) => {
    if (!supabase) {
      const idx = MOCK_MUNICIPIOS.findIndex((item) => item.id === id)
      if (idx >= 0) MOCK_MUNICIPIOS.splice(idx, 1)
      return
    }

    const { error } = await supabase.from('municipios').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }, [])

  const atualizarMunicipio = useCallback(
    async (id: string, dados: MunicipioInsert) => {
      if (!supabase) {
        const idx = MOCK_MUNICIPIOS.findIndex((item) => item.id === id)
        if (idx < 0) throw new Error('Município não encontrado.')
        MOCK_MUNICIPIOS[idx] = {
          ...MOCK_MUNICIPIOS[idx],
          ...dados,
        }
        return MOCK_MUNICIPIOS[idx]
      }

      const { data, error } = await supabase
        .from('municipios')
        .update(dados)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      return data as Municipio
    },
    [],
  )

  return {
    listarMunicipios,
    criarMunicipio,
    atualizarMunicipio,
    excluirMunicipio,
  }
}
