import { useCallback } from 'react'
import { Phone, Mail, MapPin, Briefcase, Edit2, Trash2, Copy } from 'lucide-react'
import type { Contact } from '@/types/contacts'

// ---------------------------------------------------------------------------
// Sector color mapping
// ---------------------------------------------------------------------------
const SECTOR_STYLES: Record<string, string> = {
  prefeitura: 'bg-blue-50 text-blue-700 border-blue-200',
  bombeiros: 'bg-red-50 text-red-700 border-red-200',
  visa: 'bg-green-50 text-green-700 border-green-200',
  meio_ambiente: 'bg-teal-50 text-teal-700 border-teal-200',
  jurídico: 'bg-purple-50 text-purple-700 border-purple-200',
  'assistência social': 'bg-orange-50 text-orange-700 border-orange-200',
  saneamento: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  segurança: 'bg-rose-50 text-rose-700 border-rose-200',
}

const getSectorStyle = (sector: string) =>
  SECTOR_STYLES[sector.toLowerCase()] ?? 'bg-slate-100 text-slate-700 border-slate-200'

// ---------------------------------------------------------------------------
// Initials avatar
// ---------------------------------------------------------------------------
const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ContactCardProps = {
  contact: Contact
  onEdit: () => void
  onDelete: () => void
  onCopy: (message: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ContactCard = ({ contact, onEdit, onDelete, onCopy }: ContactCardProps) => {
  // Clique simples → copia | Ctrl/Cmd+clique → abre o link
  const handleContactLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, value: string, label: string) => {
      if (e.ctrlKey || e.metaKey) return // deixa o href abrir normalmente
      e.preventDefault()
      navigator.clipboard.writeText(value)
      onCopy(`${label} copiado!`)
    },
    [onCopy]
  )

  const sectorStyle = getSectorStyle(contact.sector)
  const initials = getInitials(contact.name)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-ink-900 text-white text-sm font-bold select-none">
              {initials}
            </div>
            {/* Name + role */}
            <div>
              <h2 className="text-base font-semibold text-ink-900 leading-tight">{contact.name}</h2>
              {contact.role && <p className="mt-0.5 text-xs text-ink-500">{contact.role}</p>}
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              title="Editar contato"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink-500 hover:bg-slate-100 hover:text-ink-800 transition"
              onClick={onEdit}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              title="Excluir contato"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-white text-red-400 hover:bg-red-50 hover:text-red-600 transition"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tags: município + setor */}
        <div className="mt-3 flex flex-wrap gap-2">
          {contact.municipality
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean)
            .map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink-600"
              >
                <MapPin className="h-3 w-3" />
                {m}
              </span>
            ))}
          {contact.sector && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${sectorStyle}`}
            >
              <Briefcase className="h-3 w-3" />
              {contact.sector}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="divide-y divide-slate-100">
        {/* Telefones */}
        {contact.phones.length > 0 && (
          <section className="px-6 py-4">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <Phone className="h-3 w-3" />
              Telefones
            </p>
            <ul className="space-y-2">
              {contact.phones.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  {p.label && (
                    <span className="w-24 flex-shrink-0 text-[11px] text-ink-400 truncate">
                      {p.label}
                    </span>
                  )}
                  <a
                    href={`tel:${p.number.replace(/[\s()-]/g, '')}`}
                    className="contact-link phone-link flex-1 text-xs font-medium"
                    title="Clique para copiar · Ctrl+clique para ligar"
                    onClick={(e) => handleContactLinkClick(e, p.number, 'Telefone')}
                  >
                    {p.number}
                  </a>
                  {p.whatsapp && (
                    <a
                      href={`https://wa.me/${p.number.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir no WhatsApp"
                      className="flex-shrink-0 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5 hover:bg-green-100 transition"
                    >
                      WA
                    </a>
                  )}
                  <button
                    className="copy-hint flex-shrink-0 text-ink-300 hover:text-ink-500 transition"
                    title="Copiar"
                    onClick={() => {
                      navigator.clipboard.writeText(p.number)
                      onCopy('Telefone copiado!')
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* E-mails */}
        {contact.emails.length > 0 && (
          <section className="px-6 py-4">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <Mail className="h-3 w-3" />
              E-mails
            </p>
            <ul className="space-y-2">
              {contact.emails.map((em, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  {em.label && (
                    <span className="w-24 flex-shrink-0 text-[11px] text-ink-400 truncate">
                      {em.label}
                    </span>
                  )}
                  <a
                    href={`mailto:${em.address}`}
                    className="contact-link email-link flex-1 text-xs font-medium truncate"
                    title="Clique para copiar · Ctrl+clique para abrir"
                    onClick={(e) => handleContactLinkClick(e, em.address, 'E-mail')}
                  >
                    {em.address}
                  </a>
                  <button
                    className="copy-hint flex-shrink-0 text-ink-300 hover:text-ink-500 transition"
                    title="Copiar"
                    onClick={() => {
                      navigator.clipboard.writeText(em.address)
                      onCopy('E-mail copiado!')
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Empty state */}
        {contact.phones.length === 0 && contact.emails.length === 0 && (
          <div className="px-6 py-4 text-xs text-ink-400">
            Nenhum telefone ou e-mail cadastrado.
          </div>
        )}
      </div>

      {/* ── Footer: datas ────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-6 py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-ink-300">
          Atualizado em {new Date(contact.updated_at).toLocaleDateString('pt-BR')}
        </span>
        <span className="text-[11px] text-ink-300">
          Criado em {new Date(contact.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>

      <style>{`
        a.contact-link { text-decoration: underline; text-underline-offset: 2px; cursor: copy; }
        a.phone-link  { color: #0ea5e9; }
        a.email-link  { color: #8b5cf6; }
        a.phone-link:hover  { color: #0284c7; }
        a.email-link:hover  { color: #7c3aed; }
      `}</style>
    </article>
  )
}

export default ContactCard
