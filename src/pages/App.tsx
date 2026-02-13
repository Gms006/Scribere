import { useEffect, useMemo, useRef, useState } from 'react'

import NoteEditor from '@/components/NoteEditor'
import Toast from '@/components/Toast'
import { useAuth } from '@/context/AuthContext'
import { appName } from '@/lib/appConfig'
import { createNote, deleteNote, listNotes, updateNote } from '@/lib/notes'
import type { Note } from '@/types/notes'

const createDefaultContent = () => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
})

const normalizeTitle = (title: string) => title.trim() || 'Sem título'

// Chave para localStorage
const SELECTED_NOTE_KEY = 'scribere-selected-note-id'

const AppPage = () => {
  const { user, signOut } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContentJson, setDraftContentJson] =
    useState<Record<string, unknown>>(createDefaultContent())
  const [draftContentText, setDraftContentText] = useState('')
  const searchRef = useRef<HTMLInputElement | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const lastSavedRef = useRef<{
    id: string | null
    title: string
    contentJsonString: string
    contentText: string
  } | null>(null)

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId]
  )

  const filteredNotes = useMemo(() => {
    if (!search) {
      return notes
    }
    return notes.filter((note) => note.title.toLowerCase().includes(search.toLowerCase()))
  }, [notes, search])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    selectedIdRef.current = selectedId
    // Persiste a nota selecionada sempre que mudar
    if (selectedId) {
      localStorage.setItem(SELECTED_NOTE_KEY, selectedId)
    }
  }, [selectedId])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const loadNotes = async () => {
      if (!user) {
        return
      }
      try {
        setLoading(true)
        setError(null)

        // Timeout em 10 segundos
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tempo limite excedido ao carregar notas.')), 10000)
        )

        const data = await Promise.race([listNotes(user.id), timeoutPromise])
        setNotes(data)

        // Tentar restaurar a nota selecionada do localStorage
        const savedNoteId = localStorage.getItem(SELECTED_NOTE_KEY)
        let noteToSelect: string | null = null

        if (savedNoteId && data.some((note) => note.id === savedNoteId)) {
          noteToSelect = savedNoteId
        } else {
          noteToSelect = data[0]?.id ?? null
        }

        setSelectedId(noteToSelect)

        // Inicializa os drafts com a nota selecionada
        const initialNote = data.find((note) => note.id === noteToSelect)
        if (initialNote) {
          setDraftTitle(initialNote.title)
          setDraftContentJson(
            (initialNote.content_json ?? createDefaultContent()) as Record<string, unknown>
          )
          setDraftContentText(initialNote.content_text ?? '')
          lastSavedRef.current = {
            id: initialNote.id,
            title: normalizeTitle(initialNote.title),
            contentJsonString: JSON.stringify(initialNote.content_json ?? createDefaultContent()),
            contentText: initialNote.content_text ?? '',
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar notas.')
      } finally {
        setLoading(false)
      }
    }

    loadNotes()
  }, [user])

  useEffect(() => {
    if (!selectedNote) {
      return
    }
    
    // Só atualiza os drafts se mudarmos de nota
    if (lastSavedRef.current?.id !== selectedNote.id) {
      const nextTitle = selectedNote.title
      const nextContentJson = (selectedNote.content_json ?? createDefaultContent()) as Record<
        string,
        unknown
      >
      const nextContentText = selectedNote.content_text ?? ''

      setDraftTitle(nextTitle)
      setDraftContentJson(nextContentJson)
      setDraftContentText(nextContentText)
      
      lastSavedRef.current = {
        id: selectedNote.id,
        title: normalizeTitle(nextTitle),
        contentJsonString: JSON.stringify(nextContentJson),
        contentText: nextContentText,
      }
      
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      setIsSaving(false)
    }
  }, [selectedNote])

  useEffect(() => {
    if (!selectedNote) {
      return
    }
    const currentTitle = normalizeTitle(draftTitle)
    const currentContentJsonString = JSON.stringify(draftContentJson)
    const currentContentText = draftContentText
    const lastSaved = lastSavedRef.current
    
    const isDirty =
      !lastSaved ||
      lastSaved.id !== selectedNote.id ||
      lastSaved.title !== currentTitle ||
      lastSaved.contentJsonString !== currentContentJsonString ||
      lastSaved.contentText !== currentContentText

    if (!isDirty) {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      return
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      if (selectedIdRef.current !== selectedNote.id) {
        return
      }
      try {
        setIsSaving(true)
        const updated = await updateNote(selectedNote.id, {
          title: currentTitle,
          content_json: draftContentJson,
          content_text: currentContentText,
          pinned: selectedNote.pinned ?? false,
        })
        setNotes((prev) => prev.map((note) => (note.id === selectedNote.id ? updated : note)))
        lastSavedRef.current = {
          id: selectedNote.id,
          title: currentTitle,
          contentJsonString: currentContentJsonString,
          contentText: currentContentText,
        }
        setIsSaving(false)
      } catch {
        setToast('Erro ao salvar alterações.')
        setIsSaving(false)
      }
    }, 800)

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [draftContentJson, draftContentText, draftTitle, selectedNote])

  const handleCreateNote = async () => {
    if (!user) {
      return
    }
    try {
      const newNote = await createNote(user.id, {
        title: 'Nova nota',
        content_json: createDefaultContent(),
        content_text: '',
        pinned: false,
      })
      setNotes((prev) => [newNote, ...prev])
      setSelectedId(newNote.id)
      setDraftTitle(newNote.title)
      setDraftContentJson(
        (newNote.content_json ?? createDefaultContent()) as Record<string, unknown>
      )
      setDraftContentText(newNote.content_text ?? '')
    } catch {
      setToast('Não foi possível criar a nota.')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId)
      setNotes((prev) => {
        const updated = prev.filter((note) => note.id !== noteId)
        if (selectedId === noteId) {
          const newSelectedId = updated[0]?.id ?? null
          setSelectedId(newSelectedId)
          if (newSelectedId) {
            localStorage.setItem(SELECTED_NOTE_KEY, newSelectedId)
          } else {
            localStorage.removeItem(SELECTED_NOTE_KEY)
          }
        }
        return updated
      })
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    } catch {
      setToast('Não foi possível excluir a nota.')
    }
  }

  const statusLabel = isSaving ? 'Salvando...' : 'Tudo salvo'

  return (
    <div className="min-h-screen bg-slate-50 text-ink-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{appName}</p>
            <div className="text-lg font-semibold">Workspace pessoal</div>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-500">
            <span>{statusLabel}</span>
            <button
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-slate-100"
              type="button"
              onClick={signOut}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-8">
        <aside className="w-full max-w-xs flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Notas</p>
            <button
              className="rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-ink-700"
              type="button"
              onClick={handleCreateNote}
            >
              Nova
            </button>
          </div>

          <div className="mt-4">
            <label className="text-xs text-ink-500" htmlFor="search">
              Busca rápida (Ctrl+K)
            </label>
            <input
              ref={searchRef}
              id="search"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Buscar notas"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="mt-6 space-y-2">
            {loading && <p className="text-xs text-ink-400">Carregando notas...</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
            {!loading && filteredNotes.length === 0 && (
              <p className="text-xs text-ink-400">Nenhuma nota encontrada.</p>
            )}
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`group relative flex cursor-pointer flex-col gap-1 rounded-xl p-3 transition ${
                  selectedId === note.id ? 'bg-brand-50 shadow-sm' : 'hover:bg-slate-50'
                }`}
                onClick={() => setSelectedId(note.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-sm font-medium ${
                      selectedId === note.id ? 'text-brand-900' : 'text-ink-900'
                    }`}
                  >
                    {note.title || 'Sem título'}
                  </p>
                  <button
                    className="opacity-0 transition group-hover:opacity-100"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNote(note.id)
                    }}
                  >
                    <svg
                      className="h-4 w-4 text-ink-400 hover:text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  </button>
                </div>
                <p className="truncate text-xs text-ink-400">
                  {note.content_text || 'Nenhum conteúdo'}
                </p>
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {selectedNote ? (
            <NoteEditor
              content={draftContentJson}
              noteId={selectedNote.id}
              title={draftTitle}
              onContentChange={(json, text) => {
                setDraftContentJson(json)
                setDraftContentText(text)
              }}
              onCopy={(msg) => setToast(msg)}
              onTitleChange={setDraftTitle}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-slate-50 p-4">
                <svg
                  className="h-8 w-8 text-ink-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ink-900">Nenhuma nota selecionada</h3>
              <p className="mt-2 text-sm text-ink-500">
                Selecione uma nota na barra lateral ou crie uma nova para começar a escrever.
              </p>
              <button
                className="mt-6 rounded-xl bg-ink-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-700"
                type="button"
                onClick={handleCreateNote}
              >
                Criar nova nota
              </button>
            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default AppPage
