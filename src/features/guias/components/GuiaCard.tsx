import type { GuiaProcesso } from '@/features/guias/types'

type GuiaCardProps = {
  guia: GuiaProcesso
  onClick: () => void
}

const GuiaCard = ({ guia, onClick }: GuiaCardProps) => {
  return (
    <button
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      onClick={onClick}
      type="button"
    >
      <p className="text-sm font-semibold text-ink-900">
        {guia.tipos_processo?.nome ?? 'Tipo não informado'}
      </p>
      <p className="mt-1 text-xs text-ink-500">
        {guia.municipios?.nome ?? 'Município não informado'}
        {guia.municipios?.uf ? `/${guia.municipios.uf}` : ''}
      </p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-400">
        <span>{guia.prazo_estimado || 'Prazo não informado'}</span>
        <span>{new Date(guia.atualizado_em).toLocaleDateString('pt-BR')}</span>
      </div>
    </button>
  )
}

export default GuiaCard
