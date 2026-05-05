export interface Municipio {
  id: string
  user_id: string
  nome: string
  uf: string
  site_prefeitura?: string
  created_at: string
}

export interface TipoProcesso {
  id: string
  nome: string
  categoria: string
}

export interface GuiaProcesso {
  id: string
  user_id: string
  municipio_id: string
  tipo_id: string
  como_funciona?: string
  documentos: string[]
  etapas: string[]
  dependencia_tipo_ids: string[]
  prazo_estimado?: string
  custo_estimado?: number
  orgao_responsavel?: string
  contato_orgao?: string
  validade_tipo?: 'Definitivo' | 'Condicionado'
  validade_prazo_anos?: number
  observacoes?: string
  atualizado_em: string
  created_at: string
  municipios?: Municipio
  tipos_processo?: TipoProcesso
}
