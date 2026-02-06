import { useCallback, useEffect, useMemo } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Extension, mergeAttributes } from '@tiptap/core'
import { Selection } from '@tiptap/pm/state'
import { exitCode, newlineInCode } from '@tiptap/pm/commands'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import {
  Code as CodeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  CaseSensitive,
} from 'lucide-react'

type NoteEditorProps = {
  noteId: string | null
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
        '',
      ],
    ]
  },
})

const CustomCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-language'),
        renderHTML: (attributes) => {
          if (!attributes.language) {
            return {}
          }
          return {
            'data-language': attributes.language,
          }
        },
      },
    }
  },
  addKeyboardShortcuts() {
    return {
      Enter: () =>
        this.editor.commands.command(({ state, dispatch }) => newlineInCode(state, dispatch)),
      'Shift-Enter': () =>
        this.editor.commands.command(({ state, dispatch }) => newlineInCode(state, dispatch)),
      'Mod-Enter': () =>
        this.editor.commands.command(({ state, dispatch }) => exitCode(state, dispatch)),
    }
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'code-block-wrapper' },
      [
        'button',
        {
          class: 'code-block-copy',
          type: 'button',
          'aria-label': 'Copiar código',
          'data-code-block-copy': 'true',
        },
        '',
      ],
      ['pre', mergeAttributes(HTMLAttributes, { class: 'code-block' }), ['code', {}, 0]],
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
  noteId,
  title,
  content,
  onTitleChange,
  onContentChange,
  onCopy,
}: NoteEditorProps) => {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      InlineCode,
      CustomCodeBlock,
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
    []
  )

  const editor = useEditor(
    {
      extensions,
      content: content ?? {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      editorProps: {
        attributes: {
          class:
            'prose prose-sm max-w-none min-h-[360px] rounded-xl px-4 py-3 text-sm leading-6 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        },
      },
      onUpdate: ({ editor: updatedEditor }) => {
        onContentChange(updatedEditor.getJSON() as Record<string, unknown>, updatedEditor.getText())
      },
    },
    []
  )

  useEffect(() => {
    if (!editor || !content) return
    const currentContentString = JSON.stringify(editor.getJSON())
    const newContentString = JSON.stringify(content)
    if (currentContentString !== newContentString) {
      // Salvar posição do cursor
      const { from, to } = editor.state.selection
      editor.commands.setContent(content, false)
      // Restaurar posição do cursor
      editor.commands.setTextSelection({
        from: Math.min(from, editor.state.doc.content.size),
        to: Math.min(to, editor.state.doc.content.size),
      })
    }
  }, [editor, content, noteId])

  const fontOptions = [
    { label: 'System', value: '' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
    { label: 'Monospace', value: 'monospace' },
  ]
  const currentFont = editor?.getAttributes('textStyle')?.fontFamily ?? ''

  const handleCodeBlock = useCallback(() => {
    if (!editor) return

    // Se já está em um code block, remove
    if (editor.isActive('codeBlock')) {
      editor.chain().focus().toggleCodeBlock().run()
      return
    }

    const { state } = editor
    const { from, to, empty } = state.selection

    if (empty) {
      editor.chain().focus().toggleCodeBlock().run()
      return
    }

    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const codeBlockType = editor.state.schema.nodes.codeBlock
        if (!codeBlockType) return false

        const text = state.doc.textBetween(from, to, '\n')
        const node = codeBlockType.create(null, editor.state.schema.text(text))
        tr.replaceRangeWith(from, to, node)
        tr.setSelection(Selection.near(tr.doc.resolve(Math.min(from + 1, tr.doc.content.size))))
        return true
      })
      .run()
  }, [editor])

  const toolbar = useMemo(
    () => [
      {
        label: <span className="font-bold">H1</span>,
        name: 'Heading 1',
        action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        label: <span className="font-bold">H2</span>,
        name: 'Heading 2',
        action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        label: <span className="font-bold">H3</span>,
        name: 'Heading 3',
        action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        label: '•',
        name: 'Bullet List',
        action: () => editor?.chain().focus().toggleBulletList().run(),
      },
      {
        label: '1.',
        name: 'Ordered List',
        action: () => editor?.chain().focus().toggleOrderedList().run(),
      },
      {
        label: <span className="font-bold">B</span>,
        name: 'Bold',
        action: () => editor?.chain().focus().toggleBold().run(),
      },
      {
        label: <span className="italic">I</span>,
        name: 'Italic',
        action: () => editor?.chain().focus().toggleItalic().run(),
      },
      {
        label: <span className="underline">U</span>,
        name: 'Underline',
        action: () => editor?.chain().focus().toggleUnderline().run(),
      },
      {
        label: <span className="line-through">S</span>,
        name: 'Strike',
        action: () => editor?.chain().focus().toggleStrike().run(),
      },
      {
        label: <CodeIcon size={14} />,
        name: 'Inline Code',
        action: () => editor?.chain().focus().toggleCode().run(),
      },
      {
        label: <span className="font-mono text-xs">{'{ }'}</span>,
        name: 'Code Block',
        action: handleCodeBlock,
      },
      {
        label: <AlignLeft size={14} />,
        name: 'Align Left',
        action: () => editor?.chain().focus().setTextAlign('left').run(),
      },
      {
        label: <AlignCenter size={14} />,
        name: 'Align Center',
        action: () => editor?.chain().focus().setTextAlign('center').run(),
      },
      {
        label: <AlignRight size={14} />,
        name: 'Align Right',
        action: () => editor?.chain().focus().setTextAlign('right').run(),
      },
      {
        label: <AlignJustify size={14} />,
        name: 'Justify',
        action: () => editor?.chain().focus().setTextAlign('justify').run(),
      },
    ],
    [editor, handleCodeBlock]
  )

  const handleCopyClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement

    // Inline code copy
    const inlineButton = target.closest<HTMLButtonElement>('[data-inline-code-copy]')
    if (inlineButton) {
      const text = inlineButton.parentElement?.querySelector('code')?.textContent ?? ''
      if (text) {
        await navigator.clipboard.writeText(text)
        onCopy('Copiado!')
      }
      return
    }

    // Code block copy
    const blockButton = target.closest<HTMLButtonElement>('[data-code-block-copy]')
    if (blockButton) {
      const wrapper = blockButton.parentElement
      const text = wrapper?.querySelector('pre code')?.textContent ?? ''
      if (text) {
        await navigator.clipboard.writeText(text)
        onCopy('Copiado!')
      }
      return
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
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
            <CaseSensitive size={14} className="text-ink-400" />
            <select
              className="bg-transparent text-xs text-ink-700 focus:outline-none"
              disabled={!editor}
              value={currentFont}
              onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
            >
              {fontOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {toolbar.map((item, i) => (
            <button
              key={i}
              title={item.name}
              className="flex h-7 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-100 transition"
              onMouseDown={(e) => {
                e.preventDefault()
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
      <style>{`
        .prose h1 { font-size: 2em; font-weight: 700; margin-top: 0.67em; margin-bottom: 0.67em; }
        .prose h2 { font-size: 1.5em; font-weight: 600; margin-top: 0.83em; margin-bottom: 0.83em; }
        .prose h3 { font-size: 1.17em; font-weight: 600; margin-top: 1em; margin-bottom: 1em; }
        .prose ul, .prose ol { padding-left: 1.5rem; margin: 0.75rem 0; }
        .prose ul { list-style-type: disc; }
        .prose ol { list-style-type: decimal; }
        .prose li { margin: 0.25rem 0; }
        .prose ul ul, .prose ol ul { list-style-type: circle; }
        .prose ul ul ul, .prose ol ol ul { list-style-type: square; }
        .prose ol ol, .prose ul ol { list-style-type: lower-alpha; }
        .inline-code-group { display: inline-flex; align-items: center; gap: 0.25rem; }
        .inline-code-text { background-color: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.9em; }
        .inline-code-copy { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; background-color: #e2e8f0; border-radius: 0.25rem; border: 1px solid #cbd5e1; cursor: pointer; transition: background-color 0.2s; color: #0f172a; background-image: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%230f172a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='14' height='14' x='8' y='8' rx='2' ry='2'/%3E%3Cpath d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: center; background-size: 10px 10px; }
        .inline-code-copy:hover { background-color: #cbd5e1; }
        .code-block-wrapper { position: relative; margin: 0.75rem 0; }
        .code-block-copy { position: absolute; top: 0.5rem; right: 0.5rem; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #e2e8f0; border-radius: 0.375rem; border: 1px solid #cbd5e1; cursor: pointer; transition: all 0.2s; z-index: 10; color: #0f172a; background-image: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%230f172a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='14' height='14' x='8' y='8' rx='2' ry='2'/%3E%3Cpath d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: center; background-size: 14px 14px; }
        .code-block-copy:hover { background-color: #cbd5e1; border-color: #94a3b8; }
        .prose .code-block-wrapper pre.code-block { background-color: #f1f5f9; color: #0f172a; padding: 1rem; padding-top: 2.5rem; border-radius: 0.5rem; font-family: monospace; white-space: pre; overflow-x: auto; margin: 0; display: block; }
        .prose .code-block-wrapper pre.code-block code { background: none; color: inherit; padding: 0; font-size: 0.9em; }
      `}</style>
    </div>
  )
}

export default NoteEditor
