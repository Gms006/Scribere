import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useGuias } from '@/features/guias/hooks/useGuias'
import type { GuiaProcesso } from '@/features/guias/types'

const currencyBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const renderInline = (text: string): ReactNode[] => {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)]+)\))/g
  const matches = text.split(pattern)
  return matches.map((token, index) => {
    if (!token) return null
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index}>{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1 py-0.5 text-xs text-ink-700">
          {token.slice(1, -1)}
        </code>
      )
    }
    const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
    if (linkMatch) {
      return (
        <a
          key={index}
          className="text-brand-600 underline"
          href={linkMatch[2]}
          rel="noreferrer"
          target="_blank"
        >
          {linkMatch[1]}
        </a>
      )
    }
    return <Fragment key={index}>{token}</Fragment>
  })
}

const renderMarkdown = (content?: string) => {
  if (!content?.trim()) {
    return <p className="text-sm text-ink-500">Sem descrição cadastrada.</p>
  }

  const blocks: ReactNode[] = []
  const lines = content.split('\n')
  let index = 0

  while (index < lines.length) {
    const raw = lines[index].trim()
    if (!raw) {
      index += 1
      continue
    }

    if (raw.startsWith('### ')) {
      blocks.push(
        <h4 key={index} className="text-sm font-semibold text-ink-900">
          {renderInline(raw.slice(4))}
        </h4>
      )
      index += 1
      continue
    }

    if (raw.startsWith('## ')) {
      blocks.push(
        <h3 key={index} className="text-base font-semibold text-ink-900">
          {renderInline(raw.slice(3))}
        </h3>
      )
      index += 1
      continue
    }

    if (raw.startsWith('# ')) {
      blocks.push(
        <h2 key={index} className="text-lg font-semibold text-ink-900">
          {renderInline(raw.slice(2))}
        </h2>
      )
      index += 1
      continue
    }

    if (raw.startsWith('- ') || raw.startsWith('* ')) {
      const items: string[] = []
      while (index < lines.length) {
        const current = lines[index].trim()
        if (current.startsWith('- ') || current.startsWith('* ')) {
          items.push(current.slice(2))
          index += 1
          continue
        }
        break
      }
      blocks.push(
        <ul key={`ul-${index}`} className="list-disc space-y-1 pl-5 text-sm text-ink-700">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    blocks.push(
      <p key={index} className="text-sm leading-6 text-ink-700">
        {renderInline(raw)}
      </p>
    )
    index += 1
  }

  return <div className="space-y-3">{blocks}</div>
}

const GuiaDetalhe = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { buscarGuiaPorId, listarTiposProcesso } = useGuias()

  const [guia, setGuia] = useState<GuiaProcesso | null>(null)
  const [tiposMap, setTiposMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Guia não encontrado.')
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [data, tipos] = await Promise.all([buscarGuiaPorId(id), listarTiposProcesso()])
        if (!data) {
          setError('Guia não encontrado.')
          return
        }
        const nextTiposMap = tipos.reduce<Record<string, string>>((acc, item) => {
          acc[item.id] = item.nome
          return acc
        }, {})
        setTiposMap(nextTiposMap)
        setGuia(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar guia.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [buscarGuiaPorId, id, listarTiposProcesso])

  const sitePrefeitura = guia?.municipios?.site_prefeitura
  const custoFormatado = useMemo(() => {
    if (!guia || typeof guia.custo_estimado !== 'number') return 'Não informado'
    return currencyBRL.format(guia.custo_estimado)
  }, [guia])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-ink-500">Carregando guia...</p>
      </div>
    )
  }

  if (error || !guia) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">{error ?? 'Guia não encontrado.'}</p>
        <Link className="mt-4 inline-block text-xs font-semibold text-brand-600" to="/guias">
          Voltar para listagem
        </Link>
      </div>
    )
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex justify-start">
        <button
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-slate-50"
          onClick={() => navigate('/guias')}
          type="button"
        >
          Voltar
        </button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Guia de processo
          </p>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">{guia.tipos_processo?.nome}</h1>
          <p className="text-sm text-ink-500">
            {guia.municipios?.nome}/{guia.municipios?.uf}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink-600">
          {guia.prazo_estimado || 'Prazo não informado'}
        </span>
      </header>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-ink-900">Documentos necessários</h2>
        <div className="mt-2 space-y-1.5">
          {guia.documentos.length === 0 && <p className="text-xs text-ink-500">Não informado.</p>}
          {guia.documentos.map((documento, index) => (
            <div
              key={`${documento}-${index}`}
              className="flex items-center gap-2 text-sm text-ink-700"
            >
              <span className="h-4 w-4 rounded border border-slate-300 bg-white" />
              <span>{documento}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-ink-900">Etapas</h2>
        {guia.etapas.length === 0 ? (
          <p className="mt-2 text-xs text-ink-500">Não informado.</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ink-700">
            {guia.etapas.map((etapa, index) => (
              <li key={`${etapa}-${index}`}>{etapa}</li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-ink-900">Dependências</h2>
        {guia.dependencia_tipo_ids.length === 0 ? (
          <p className="mt-2 text-xs text-ink-500">Este processo não possui dependências.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {guia.dependencia_tipo_ids.map((tipoIdDependente) => (
              <p key={tipoIdDependente} className="text-sm text-ink-700">
                Depende da finalização de{' '}
                <span className="font-semibold text-ink-900">
                  {tiposMap[tipoIdDependente] ?? 'Processo não identificado'}
                </span>
                .
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-ink-900">Como funciona</h2>
        <div className="mt-2">{renderMarkdown(guia.como_funciona)}</div>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-ink-900">Informações adicionais</h2>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-ink-700 md:grid-cols-2">
          <p>
            <span className="font-medium text-ink-900">Órgão responsável:</span>{' '}
            {guia.orgao_responsavel || 'Não informado'}
          </p>
          <p>
            <span className="font-medium text-ink-900">Custo estimado:</span> {custoFormatado}
          </p>
          <p>
            <span className="font-medium text-ink-900">Contato do órgão:</span>{' '}
            {guia.contato_orgao || 'Não informado'}
          </p>
          <p>
            <span className="font-medium text-ink-900">Validade:</span>{' '}
            {guia.validade_tipo === 'Condicionado'
              ? guia.validade_prazo_anos
                ? `${guia.validade_prazo_anos} ano(s) (condicionado)`
                : 'Condicionado'
              : 'Definitivo'}
          </p>
          {sitePrefeitura && (
            <p className="md:col-span-2">
              <span className="font-medium text-ink-900">Prefeitura:</span>{' '}
              <a
                className="text-brand-600 underline"
                href={sitePrefeitura}
                rel="noreferrer"
                target="_blank"
              >
                {sitePrefeitura}
              </a>
            </p>
          )}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-ink-900">Observações</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">
          {guia.observacoes || 'Sem observações.'}
        </p>
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-ink-500">
          Atualizado em {new Date(guia.atualizado_em).toLocaleString('pt-BR')}
        </p>
        <button
          className="rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-700"
          onClick={() => navigate(`/guias/${guia.id}/editar`)}
          type="button"
        >
          Editar
        </button>
      </footer>
    </article>
  )
}

export default GuiaDetalhe
