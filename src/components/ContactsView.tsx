import { useEffect, useMemo, useState } from 'react'
import { UserPlus, Search } from 'lucide-react'
import { createContact, deleteContact, listContacts, updateContact } from '@/lib/contacts'
import type { Contact, ContactUpsert } from '@/types/contacts'
import ContactCard from '@/components/ContactCard'
import ContactForm from '@/components/ContactForm'

type Mode = 'view' | 'create' | 'edit'

type ContactsViewProps = {
  userId: string
  onToast: (message: string) => void
}

// ---------------------------------------------------------------------------
// Sector badge — compact, for the sidebar list
// ---------------------------------------------------------------------------
const SECTOR_COLORS: Record<string, string> = {
  prefeitura: 'bg-blue-50 text-blue-600',
  bombeiros: 'bg-red-50 text-red-600',
  visa: 'bg-green-50 text-green-600',
  meio_ambiente: 'bg-teal-50 text-teal-600',
  saúde: 'bg-teal-50 text-teal-600',
  jurídico: 'bg-purple-50 text-purple-600',
}

const sectorBadgeClass = (s: string) =>
  SECTOR_COLORS[s.toLowerCase()] ?? 'bg-slate-100 text-slate-600'

// ---------------------------------------------------------------------------
// ContactsView
// ---------------------------------------------------------------------------
const ContactsView = ({ userId, onToast }: ContactsViewProps) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('view')

  const [search, setSearch] = useState('')
  const [municipalityFilter, setMunicipalityFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await listContacts(userId)
        setContacts(data)
        setSelectedId(data[0]?.id ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar contatos.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  // ── Derived ───────────────────────────────────────────────────────────────
  // Split each contact's municipality string and collect unique values
  const municipalities = useMemo(
    () =>
      [
        ...new Set(
          contacts.flatMap((c) =>
            c.municipality
              .split(',')
              .map((m) => m.trim())
              .filter(Boolean),
          ),
        ),
      ].sort(),
    [contacts],
  )

  const sectors = useMemo(
    () => [...new Set(contacts.map((c) => c.sector).filter(Boolean))].sort(),
    [contacts],
  )

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase()
    return contacts.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.municipality.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q) ||
        c.phones.some((p) => p.number.includes(q)) ||
        c.emails.some((e) => e.address.toLowerCase().includes(q))
      const matchMunicipality =
        !municipalityFilter ||
        c.municipality
          .split(',')
          .map((m) => m.trim())
          .includes(municipalityFilter)
      const matchSector = !sectorFilter || c.sector === sectorFilter
      return matchSearch && matchMunicipality && matchSector
    })
  }, [contacts, search, municipalityFilter, sectorFilter])

  // A contact with multiple municipalities appears under each one
  const grouped = useMemo(() => {
    const map = new Map<string, Contact[]>()
    for (const c of filteredContacts) {
      const keys = c.municipality
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
      const effectiveKeys = keys.length ? keys : ['Sem município']
      for (const key of effectiveKeys) {
        const arr = map.get(key) ?? []
        arr.push(c)
        map.set(key, arr)
      }
    }
    // Sort map by key
    return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)))
  }, [filteredContacts])

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId],
  )

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreate = async (data: ContactUpsert) => {
    const created = await createContact(userId, data)
    setContacts((prev) => [created, ...prev])
    setSelectedId(created.id)
    setMode('view')
    onToast('Contato criado!')
  }

  const handleUpdate = async (data: ContactUpsert) => {
    if (!selectedId) return
    const updated = await updateContact(selectedId, data)
    setContacts((prev) => prev.map((c) => (c.id === selectedId ? updated : c)))
    setMode('view')
    onToast('Contato atualizado!')
  }

  const handleDelete = async (contactId: string) => {
    try {
      await deleteContact(contactId)
      setContacts((prev) => {
        const next = prev.filter((c) => c.id !== contactId)
        if (selectedId === contactId) setSelectedId(next[0]?.id ?? null)
        return next
      })
      if (mode === 'edit') setMode('view')
      onToast('Contato excluído.')
    } catch {
      onToast('Não foi possível excluir o contato.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex w-full gap-6">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-full max-w-xs flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Agenda</p>
          <button
            className="rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-ink-700 transition"
            onClick={() => { setMode('create'); setSelectedId(null) }}
            type="button"
          >
            <span className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              Novo
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-400" />
            <input
              className="w-full rounded-xl border border-slate-200 py-2 pl-7 pr-3 text-xs text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Buscar contatos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        {(municipalities.length > 1 || sectors.length > 1) && (
          <div className="mt-3 flex flex-col gap-2">
            {municipalities.length > 1 && (
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-ink-600 focus:border-brand-500 focus:outline-none"
                value={municipalityFilter}
                onChange={(e) => setMunicipalityFilter(e.target.value)}
              >
                <option value="">Todos os municípios</option>
                {municipalities.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            {sectors.length > 1 && (
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-ink-600 focus:border-brand-500 focus:outline-none"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
              >
                <option value="">Todos os setores</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* List */}
        <div className="mt-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {loading && <p className="text-xs text-ink-400">Carregando...</p>}
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
          {!loading && !error && filteredContacts.length === 0 && (
            <p className="text-xs text-ink-400">Nenhum contato encontrado.</p>
          )}

          {[...grouped.entries()].map(([municipality, list]) => (
            <div key={municipality}>
              {/* Municipality header */}
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-300">
                {municipality}
              </p>
              <div className="space-y-1.5">
                {list.map((c) => (
                  <button
                    key={c.id}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      c.id === selectedId && mode !== 'create'
                        ? 'border-ink-900 bg-slate-100 text-ink-900'
                        : 'border-slate-200 text-ink-600 hover:bg-slate-50'
                    }`}
                    onClick={() => { setSelectedId(c.id); setMode('view') }}
                    type="button"
                  >
                    <p className="truncate text-xs font-semibold">{c.name || 'Sem nome'}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {c.sector && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${sectorBadgeClass(c.sector)}`}
                        >
                          {c.sector}
                        </span>
                      )}
                      {c.phones.length > 0 && (
                        <span className="text-[10px] text-ink-400">
                          {c.phones.length} tel.
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0">
        {mode === 'create' && (
          <ContactForm
            contact={null}
            onSave={handleCreate}
            onCancel={() => { setMode('view') }}
          />
        )}

        {mode === 'edit' && selectedContact && (
          <ContactForm
            contact={selectedContact}
            onSave={handleUpdate}
            onCancel={() => setMode('view')}
          />
        )}

        {mode === 'view' && selectedContact && (
          <ContactCard
            contact={selectedContact}
            onEdit={() => setMode('edit')}
            onDelete={() => handleDelete(selectedContact.id)}
            onCopy={onToast}
          />
        )}

        {mode === 'view' && !selectedContact && !loading && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-ink-700">Agenda vazia</p>
            <p className="mt-2 text-xs text-ink-500">
              Adicione prefeituras, setores e outros contatos municipais.
            </p>
            <button
              className="mt-6 rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-700 transition"
              onClick={() => setMode('create')}
              type="button"
            >
              Criar primeiro contato
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default ContactsView