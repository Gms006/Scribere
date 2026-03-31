import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Contact, ContactUpsert, PhoneEntry, EmailEntry } from '@/types/contacts'

type ContactFormProps = {
  contact?: Contact | null
  onSave: (data: ContactUpsert) => Promise<void>
  onCancel: () => void
}

const emptyPhone = (): PhoneEntry => ({ label: '', number: '', whatsapp: false })
const emptyEmail = (): EmailEntry => ({ label: '', address: '' })

const ContactForm = ({ contact, onSave, onCancel }: ContactFormProps) => {
  const [name, setName] = useState(contact?.name ?? '')
  const [role, setRole] = useState(contact?.role ?? '')
  const [municipality, setMunicipality] = useState(contact?.municipality ?? '')
  const [sector, setSector] = useState(contact?.sector ?? '')
  const [phones, setPhones] = useState<PhoneEntry[]>(
    contact?.phones.length ? contact.phones : [emptyPhone()],
  )
  const [emails, setEmails] = useState<EmailEntry[]>(
    contact?.emails.length ? contact.emails : [emptyEmail()],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Phone handlers ────────────────────────────────────────────────────────
  const setPhone = (i: number, field: keyof PhoneEntry, value: string | boolean) =>
    setPhones((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))

  const addPhone = () => setPhones((prev) => [...prev, emptyPhone()])

  const removePhone = (i: number) =>
    setPhones((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  // ── Email handlers ────────────────────────────────────────────────────────
  const setEmail = (i: number, field: keyof EmailEntry, value: string) =>
    setEmails((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)))

  const addEmail = () => setEmails((prev) => [...prev, emptyEmail()])

  const removeEmail = (i: number) =>
    setEmails((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('O nome é obrigatório.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        role: role.trim(),
        municipality: municipality.trim(),
        sector: sector.trim(),
        phones: phones.filter((p) => p.number.trim()),
        emails: emails.filter((e) => e.address.trim()),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar contato.')
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-ink-900 mb-5">
        {contact ? 'Editar contato' : 'Novo contato'}
      </h3>

      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">
            Nome <span className="text-red-400">*</span>
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Ex.: Prefeitura Municipal de Anápolis"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Cargo */}
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Cargo / Função</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Ex.: Central de Atendimento"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        {/* Município + Setor (lado a lado) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">
              Município
              <span className="ml-1 font-normal text-ink-400">(separe por vírgula)</span>
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Ex.: Anápolis, Goiânia"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Setor</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Ex.: Prefeitura, VISA, Bombeiros"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </div>
        </div>

        {/* Telefones */}
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-2">Telefones</label>
          <div className="space-y-2">
            {phones.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Rótulo"
                  value={p.label}
                  onChange={(e) => setPhone(i, 'label', e.target.value)}
                />
                <input
                  className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="(62) 99999-9999"
                  value={p.number}
                  onChange={(e) => setPhone(i, 'number', e.target.value)}
                />
                <label className="flex items-center gap-1 cursor-pointer select-none flex-shrink-0" title="WhatsApp?">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-green-500"
                    checked={p.whatsapp}
                    onChange={(e) => setPhone(i, 'whatsapp', e.target.checked)}
                  />
                  <span className="text-[11px] text-green-600 font-medium">WA</span>
                </label>
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-ink-400 hover:bg-slate-100 hover:text-red-500 transition"
                  onClick={() => removePhone(i)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            className="mt-2 flex items-center gap-1 text-[11px] font-medium text-ink-400 hover:text-ink-700 transition"
            onClick={addPhone}
            type="button"
          >
            <Plus className="h-3 w-3" />
            Adicionar telefone
          </button>
        </div>

        {/* E-mails */}
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-2">E-mails</label>
          <div className="space-y-2">
            {emails.map((em, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Rótulo"
                  value={em.label}
                  onChange={(e) => setEmail(i, 'label', e.target.value)}
                />
                <input
                  type="email"
                  className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="contato@municipio.go.gov.br"
                  value={em.address}
                  onChange={(e) => setEmail(i, 'address', e.target.value)}
                />
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-ink-400 hover:bg-slate-100 hover:text-red-500 transition"
                  onClick={() => removeEmail(i)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            className="mt-2 flex items-center gap-1 text-[11px] font-medium text-ink-400 hover:text-ink-700 transition"
            onClick={addEmail}
            type="button"
          >
            <Plus className="h-3 w-3" />
            Adicionar e-mail
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-slate-50 transition"
          onClick={onCancel}
          type="button"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          className="rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-700 transition disabled:opacity-50"
          onClick={handleSubmit}
          type="button"
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

export default ContactForm