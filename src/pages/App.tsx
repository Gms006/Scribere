import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import NoteEditor from '@/components/NoteEditor'
import ContactsView from '@/components/ContactsView'
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

const SELECTED_NOTE_KEY = 'scribere:selectedNoteId'

type Tab = 'notes' | 'contacts'

const AppPage = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('notes')

  // ── Notes state ───────────────────────────────────────────────────────────
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
  const hydratedSelectedIdRef = useRef<string | null>(null)
  const saveRequestIdRef = useRef(0)
  const lastSavedRef = useRef<{
    id: string | null
    title: string
    contentJsonString: string
    contentText: string
  } | null>(null)

  const selectNote = (id: string | null) => {
    setSelectedId(id)
    if (id) localStorage.setItem(SELECTED_NOTE_KEY, id)
    else localStorage.removeItem(SELECTED_NOTE_KEY)
  }

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId]
  )

  const filteredNotes = useMemo(() => {
    if (!search) return notes
    return notes.filter((note) => note.title.toLowerCase().includes(search.toLowerCase()))
  }, [notes, search])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (activeTab === 'notes') searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTab])

  useEffect(() => {
    selectedIdRef.current = selectedId
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
      if (!user) return
      try {
        setLoading(true)
        setError(null)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tempo limite excedido ao carregar notas.')), 10000)
        )
        const data = await Promise.race([listNotes(user.id), timeoutPromise])
        setNotes(data)

        const savedId = localStorage.getItem(SELECTED_NOTE_KEY)
        const noteToSelect = data.find((note) => note.id === savedId) ?? data[0] ?? null
        selectNote(noteToSelect?.id ?? null)

        if (noteToSelect) {
          setDraftTitle(noteToSelect.title)
          setDraftContentJson(
            (noteToSelect.content_json ?? createDefaultContent()) as Record<string, unknown>
          )
          setDraftContentText(noteToSelect.content_text ?? '')
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
    if (!selectedId) {
      hydratedSelectedIdRef.current = null
      return
    }
    if (hydratedSelectedIdRef.current === selectedId) return

    const noteToHydrate = notes.find((note) => note.id === selectedId)
    if (!noteToHydrate) return

    hydratedSelectedIdRef.current = selectedId

    const nextTitle = noteToHydrate.title
    const nextContentJson = (noteToHydrate.content_json ?? createDefaultContent()) as Record<
      string,
      unknown
    >
    const nextContentText = noteToHydrate.content_text ?? ''
    setDraftTitle(nextTitle)
    setDraftContentJson(nextContentJson)
    setDraftContentText(nextContentText)
    lastSavedRef.current = {
      id: noteToHydrate.id,
      title: normalizeTitle(nextTitle),
      contentJsonString: JSON.stringify(nextContentJson),
      contentText: nextContentText,
    }
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    saveRequestIdRef.current += 1
    setIsSaving(false)
  }, [notes, selectedId])

  useEffect(() => {
    if (!selectedNote) return
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

    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = window.setTimeout(async () => {
      if (selectedIdRef.current !== selectedNote.id) return
      const requestId = ++saveRequestIdRef.current
      try {
        setIsSaving(true)
        const updated = await updateNote(selectedNote.id, {
          title: currentTitle,
          content_json: draftContentJson,
          content_text: currentContentText,
          pinned: selectedNote.pinned ?? false,
        })
        if (requestId !== saveRequestIdRef.current) return
        setNotes((prev) => prev.map((note) => (note.id === selectedNote.id ? updated : note)))
        lastSavedRef.current = {
          id: selectedNote.id,
          title: currentTitle,
          contentJsonString: currentContentJsonString,
          contentText: currentContentText,
        }
        setIsSaving(false)
      } catch {
        if (requestId !== saveRequestIdRef.current) return
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
    if (!user) return
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
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-full items-center justify-between px-4">
          {/* Left: branding */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{appName}</p>
            <div className="text-lg font-semibold">Workspace pessoal</div>
          </div>

          {/* Center: tab switcher */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              className={`rounded-lg px-5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'notes'
                  ? 'bg-white shadow-sm text-ink-900'
                  : 'text-ink-400 hover:text-ink-700'
              }`}
              onClick={() => setActiveTab('notes')}
              type="button"
            >
              Notas
            </button>
            <button
              className={`rounded-lg px-5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'contacts'
                  ? 'bg-white shadow-sm text-ink-900'
                  : 'text-ink-400 hover:text-ink-700'
              }`}
              onClick={() => setActiveTab('contacts')}
              type="button"
            >
              Agenda
            </button>
            <button
              className="rounded-lg px-5 py-1.5 text-xs font-semibold text-ink-400 transition hover:text-ink-700"
              onClick={() => navigate('/guias')}
              type="button"
            >
              Guias de processo
            </button>
          </div>

          {/* Right: status + sign out */}
          <div className="flex items-center gap-3 text-sm text-ink-500">
            {activeTab === 'notes' && <span className="text-xs">{statusLabel}</span>}
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

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-full gap-6 px-4 py-8">
        {activeTab === 'notes' ? (
          <>
            {/* Notes sidebar */}
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
                {error && (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                  </div>
                )}
                {!loading && !error && filteredNotes.length === 0 && (
                  <p className="text-xs text-ink-400">Nenhuma nota encontrada.</p>
                )}
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-xl border px-3 py-2 text-xs transition ${
                      note.id === selectedId
                        ? 'border-ink-900 bg-slate-100 text-ink-900'
                        : 'border-slate-200 text-ink-600 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      className="w-full text-left font-semibold"
                      type="button"
                      onClick={() => selectNote(note.id)}
                    >
                      {note.title || 'Sem título'}
                    </button>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-ink-400">
                      <span>{new Date(note.updated_at).toLocaleDateString('pt-BR')}</span>
                      <button
                        aria-label="Excluir nota"
                        className="text-ink-400 hover:text-red-500"
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Notes main */}
            <main className="flex-1 min-w-0">
              {!selectedNote && !loading && !error && (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm font-semibold text-ink-700">Sem notas ainda</p>
                  <p className="mt-2 text-xs text-ink-500">
                    Crie uma nota para começar a organizar suas ideias.
                  </p>
                  <button
                    className="mt-6 rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-700"
                    type="button"
                    onClick={handleCreateNote}
                  >
                    Criar primeira nota
                  </button>
                </div>
              )}
              {selectedNote && (
                <NoteEditor
                  key={selectedNote.id}
                  noteId={selectedNote.id}
                  title={draftTitle}
                  content={draftContentJson}
                  onTitleChange={setDraftTitle}
                  onContentChange={(json, text) => {
                    setDraftContentJson(json)
                    setDraftContentText(text)
                  }}
                  onCopy={(message) => setToast(message)}
                />
              )}
            </main>
          </>
        ) : (
          // Contacts tab — ContactsView owns its own aside + main
          user && <ContactsView userId={user.id} onToast={(message) => setToast(message)} />
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default AppPage
