import { supabase } from '@/lib/supabaseClient'
import type { Note } from '@/types/notes'

type NoteInsert = Pick<Note, 'title' | 'content_json' | 'content_text' | 'pinned'>

type NoteUpdate = Pick<Note, 'title' | 'content_json' | 'content_text' | 'pinned'>

// Dados mock para desenvolvimento local
const MOCK_NOTES: Note[] = [
  {
    id: '1',
    user_id: 'dev-user',
    title: 'Bem-vindo ao Scribere',
    content_json: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Esta é uma nota de teste no modo de desenvolvimento.' }],
        },
      ],
    },
    content_text: 'Esta é uma nota de teste no modo de desenvolvimento.',
    pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const ensureClient = () => {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }
}

const getClient = () => {
  ensureClient()
  return supabase!
}

export const listNotes = async (userId: string) => {
  try {
    if (!supabase) {
      // Modo de desenvolvimento com dados mock
      await new Promise((resolve) => setTimeout(resolve, 500))
      return MOCK_NOTES
    }

    const client = getClient()
    const { data, error } = await client
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao carregar notas: ${error.message}`)
    }

    return data as Note[]
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Erro desconhecido ao carregar notas.')
  }
}

export const createNote = async (userId: string, payload: NoteInsert) => {
  if (!supabase) {
    // Development mode - return mock note
    const newNote: Note = {
      id: `note-${Date.now()}`,
      user_id: userId,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_NOTES.unshift(newNote)
    return newNote
  }

  const client = getClient()
  const { data, error } = await client
    .from('notes')
    .insert({
      ...payload,
      user_id: userId,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Note
}

export const updateNote = async (noteId: string, payload: NoteUpdate) => {
  if (!supabase) {
    // Development mode - update mock note
    const noteIndex = MOCK_NOTES.findIndex((n) => n.id === noteId)
    if (noteIndex === -1) {
      throw new Error('Nota não encontrada')
    }
    const updated = {
      ...MOCK_NOTES[noteIndex],
      ...payload,
      updated_at: new Date().toISOString(),
    }
    MOCK_NOTES[noteIndex] = updated
    return updated
  }

  const client = getClient()
  const { data, error } = await client
    .from('notes')
    .update(payload)
    .eq('id', noteId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Note
}

export const deleteNote = async (noteId: string) => {
  if (!supabase) {
    // Development mode - delete mock note
    const index = MOCK_NOTES.findIndex((n) => n.id === noteId)
    if (index !== -1) {
      MOCK_NOTES.splice(index, 1)
    }
    return
  }
  const client = getClient()
  const { error } = await client.from('notes').delete().eq('id', noteId)

  if (error) {
    throw new Error(error.message)
  }
}
