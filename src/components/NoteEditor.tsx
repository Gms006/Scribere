import { useMemo, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Extension, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Code from '@tiptap/extension-code'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'

type NoteEditorProps = {
  title: string
  content: Record<string, unknown> | null
  onTitleChange: (value: string) => void
  onContentChange: (value: Record<string, unknown>, plainText: string) => void
  onCopy: (message: string) => void
}

const InlineCode = Code.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      { class: 'inline-code-group' },
      ['code', mergeAttributes(HTMLAttributes, { class: 'inline-code-text' }), 0],
      [
        'button',
        {
          class: 'inline-code-copy',
          type: 'button',
          'aria-label': 'Copiar código',
          'data-inline-code-copy': 'true',
        },
        'Copiar',
      ],
    ]
  },
})

const ListIndent = Extension.create({
  name: 'listIndent',
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.sinkListItem('listItem'),
      'Shift-Tab': () => this.editor.commands.liftListItem('listItem'),
    }
  },
})

const NoteEditor = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  onCopy,
}: NoteEditorProps) => {
  const [debugJson, setDebugJson] = useState<Record<string, unknown> | null>(content ?? null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        code: false,
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        listItem: {},
      }),
      InlineCode,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      ListIndent,
    ],
    content: content ?? {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[360px] rounded-xl px-4 py-3 text-sm leading-6 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      if (import.meta.env.DEV) {
        setDebugJson(updatedEditor.getJSON() as Record<string, unknown>)
      }
      onContentChange(updatedEditor.getJSON() as Record<string, unknown>, updatedEditor.getText())
    },
    onCreate: ({ editor: createdEditor }) => {
      if (import.meta.env.DEV) {
        setDebugJson(createdEditor.getJSON() as Record<string, unknown>)
      }
    },
  })

  const fontOptions = [
    { label: 'System', value: '' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
    {
      label: 'Monospace',
      value:
        '"SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  ]
  const currentFont = editor?.getAttributes('textStyle')?.fontFamily ?? ''

  const toolbar = useMemo(
    () => [
      {
        label: 'H1',
        name: 'Heading 1',
        action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        label: 'H2',
        name: 'Heading 2',
        action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        label: 'H3',
        name: 'Heading 3',
        action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      { label: '•', name: 'Bullet List', action: () => editor?.chain().focus().toggleBulletList().run() },
      {
        label: '1.',
        name: 'Ordered List',
        action: () => editor?.chain().focus().toggleOrderedList().run(),
      },
      { label: 'B', name: 'Bold', action: () => editor?.chain().toggleBold().run() },
      { label: 'I', name: 'Italic', action: () => editor?.chain().toggleItalic().run() },
      { label: 'U', name: 'Underline', action: () => editor?.chain().toggleUnderline().run() },
      { label: 'S', name: 'Strike', action: () => editor?.chain().toggleStrike().run() },
      { label: '</>', name: 'Inline Code', action: () => editor?.chain().toggleCode().run() },
      { label: '↤', name: 'Align Left', action: () => editor?.chain().focus().setTextAlign('left').run() },
      { label: '↔', name: 'Align Center', action: () => editor?.chain().focus().setTextAlign('center').run() },
      { label: '↦', name: 'Align Right', action: () => editor?.chain().focus().setTextAlign('right').run() },
      { label: '≡', name: 'Justify', action: () => editor?.chain().focus().setTextAlign('justify').run() },
    ],
    [editor]
  )

  const handleCopyClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLButtonElement>('[data-inline-code-copy]')
    if (!button) {
      return
    }

    const wrapper = button.parentElement
    const codeElement = wrapper?.querySelector('code')
    const text = codeElement?.textContent ?? ''

    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      onCopy('Copiado!')
    } catch {
      onCopy('Não foi possível copiar.')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          className="w-full text-2xl font-semibold text-ink-900 outline-none placeholder:text-ink-300"
          placeholder="Título da nota"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
          <label className="sr-only" htmlFor="font-family-select">
            Fonte
          </label>
          <select
            id="font-family-select"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            disabled={!editor}
            value={currentFont}
            onChange={(event) => {
              if (!editor) {
                return
              }
              const value = event.target.value
              if (!value) {
                editor.chain().focus().unsetFontFamily().run()
                return
              }
              editor.chain().focus().setFontFamily(value).run()
            }}
          >
            {fontOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {toolbar.map((item) => (
            <button
              key={item.label}
              title={item.name}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-ink-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              type="button"
              disabled={!editor}
              onMouseDown={(event) => {
                event.preventDefault()
                item.action()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6" onClick={handleCopyClick}>
        <EditorContent editor={editor} />
      </div>

      {import.meta.env.DEV && debugJson && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Debug JSON</p>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-ink-600">
            {JSON.stringify(debugJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default NoteEditor
