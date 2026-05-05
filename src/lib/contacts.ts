import { supabase } from '@/lib/supabaseClient'
import type { Contact, ContactUpsert } from '@/types/contacts'

// Mock data para desenvolvimento local
const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact-1',
    user_id: 'dev-user',
    name: 'Prefeitura Municipal de Anápolis',
    role: 'Central de Atendimento',
    municipality: 'Anápolis',
    sector: 'Prefeitura',
    phones: [
      { label: 'Central', number: '6233100000', whatsapp: false },
      { label: 'Ouvidoria', number: '6233100001', whatsapp: false },
    ],
    emails: [{ label: 'Ouvidoria', address: 'ouvidoria@anapolis.go.gov.br' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'contact-2',
    user_id: 'dev-user',
    name: 'Corpo de Bombeiros',
    role: '4º Grupamento de Bombeiros',
    municipality: 'Anápolis',
    sector: 'Bombeiros',
    phones: [
      { label: 'Emergência', number: '193', whatsapp: false },
      { label: 'Administrativo', number: '6233XXXXXX', whatsapp: false },
    ],
    emails: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'contact-3',
    user_id: 'dev-user',
    name: 'VISA Anápolis',
    role: 'Vigilância Sanitária Municipal',
    municipality: 'Anápolis',
    sector: 'VISA',
    phones: [{ label: 'Direto', number: '6233XXXXXX', whatsapp: false }],
    emails: [{ label: 'Contato', address: 'visa@anapolis.go.gov.br' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const getClient = () => {
  if (!supabase) throw new Error('Supabase não configurado')
  return supabase!
}

export const listContacts = async (userId: string): Promise<Contact[]> => {
  try {
    if (!supabase) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return MOCK_CONTACTS.filter((c) => c.user_id === 'dev-user')
    }

    const { data, error } = await getClient()
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('municipality', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw new Error(`Erro ao carregar contatos: ${error.message}`)
    return data as Contact[]
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Erro desconhecido ao carregar contatos.')
  }
}

export const createContact = async (userId: string, payload: ContactUpsert): Promise<Contact> => {
  if (!supabase) {
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      user_id: userId,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_CONTACTS.unshift(newContact)
    return newContact
  }

  const { data, error } = await getClient()
    .from('contacts')
    .insert({ ...payload, user_id: userId })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Contact
}

export const updateContact = async (
  contactId: string,
  payload: ContactUpsert
): Promise<Contact> => {
  if (!supabase) {
    const idx = MOCK_CONTACTS.findIndex((c) => c.id === contactId)
    if (idx === -1) throw new Error('Contato não encontrado')
    const updated = { ...MOCK_CONTACTS[idx], ...payload, updated_at: new Date().toISOString() }
    MOCK_CONTACTS[idx] = updated
    return updated
  }

  const { data, error } = await getClient()
    .from('contacts')
    .update(payload)
    .eq('id', contactId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Contact
}

export const deleteContact = async (contactId: string): Promise<void> => {
  if (!supabase) {
    const idx = MOCK_CONTACTS.findIndex((c) => c.id === contactId)
    if (idx !== -1) MOCK_CONTACTS.splice(idx, 1)
    return
  }

  const { error } = await getClient().from('contacts').delete().eq('id', contactId)
  if (error) throw new Error(error.message)
}
