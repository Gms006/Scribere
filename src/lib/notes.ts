import { supabase } from '@/lib/supabaseClient'
import type { Note } from '@/types/notes'

type NoteInsert = Pick<Note, 'title' | 'content_json' | 'content_text' | 'pinned'>

type NoteUpdate = Pick<Note, 'title' | 'content_json' | 'content_text' | 'pinned'>

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
  const client = getClient()
  const { data, error } = await client
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as Note[]
}

export const createNote = async (userId: string, payload: NoteInsert) => {
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
  const client = getClient()
  const { error } = await client.from('notes').delete().eq('id', noteId)

  if (error) {
    throw new Error(error.message)
  }
}
