export type PhoneEntry = {
  label: string
  number: string
  whatsapp: boolean
}

export type EmailEntry = {
  label: string
  address: string
}

export type Contact = {
  id: string
  user_id: string
  name: string
  role: string
  municipality: string
  sector: string
  phones: PhoneEntry[]
  emails: EmailEntry[]
  created_at: string
  updated_at: string
}

export type ContactUpsert = Pick<
  Contact,
  'name' | 'role' | 'municipality' | 'sector' | 'phones' | 'emails'
>