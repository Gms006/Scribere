import { useCallback, useEffect, useMemo } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Extension, Mark, mergeAttributes } from '@tiptap/core'
import type { CommandProps } from '@tiptap/core'
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
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
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

const TextStyleAttributes = Extension.create({
  name: 'textStyleAttributes',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          color: {
            default: null,
            parseHTML: (element) => element.style.color || null,
            renderHTML: (attributes) =>
              attributes.color ? { style: `color: ${attributes.color}` } : {},
          },
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setColor:
        (color: string) =>
        ({ chain }: CommandProps) =>
          chain()
            .setMark('textStyle', { ...this.editor.getAttributes('textStyle'), color })
            .run(),
      unsetColor:
        () =>
        ({ chain }: CommandProps) => {
          const attrs = this.editor.getAttributes('textStyle') as {
            color?: string | null
            fontSize?: string | null
            fontFamily?: string | null
          }
          const next = { ...attrs, color: null }
          const command = chain().setMark('textStyle', next)
          if (!next.fontSize && !next.fontFamily) {
            return command.unsetMark('textStyle').run()
          }
          return command.run()
        },
      setFontSize:
        (fontSize: string) =>
        ({ chain }: CommandProps) =>
          chain()
            .setMark('textStyle', { ...this.editor.getAttributes('textStyle'), fontSize })
            .run(),
      unsetFontSize:
        () =>
        ({ chain }: CommandProps) => {
          const attrs = this.editor.getAttributes('textStyle') as {
            color?: string | null
            fontSize?: string | null
            fontFamily?: string | null
          }
          const next = { ...attrs, fontSize: null }
          const command = chain().setMark('textStyle', next)
          if (!next.color && !next.fontFamily) {
            return command.unsetMark('textStyle').run()
          }
          return command.run()
        },
    }
  },
})

const HighlightMark = Mark.create({
  name: 'highlight',
  excludes: '',
  addAttributes() {
    return {
      color: {
        default: '#fde047',
        parseHTML: (element) => element.style.backgroundColor || '#fde047',
        renderHTML: (attributes) =>
          attributes.color ? { style: `background-color: ${attributes.color}` } : {},
      },
    }
  },
  parseHTML() {
    return [{ tag: 'mark' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes), 0]
  },
  addCommands() {
    return {
      setHighlight:
        (color: string) =>
        ({ chain }: CommandProps) =>
          chain().setMark('highlight', { color }).run(),
      toggleHighlight:
        (color: string) =>
        ({ chain }: CommandProps) =>
          chain().toggleMark('highlight', { color }).run(),
      unsetHighlight:
        () =>
        ({ chain }: CommandProps) =>
          chain().unsetMark('highlight').run(),
    }
  },
})

const Superscript = Mark.create({
  name: 'superscript',
  parseHTML() {
    return [{ tag: 'sup' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['sup', mergeAttributes(HTMLAttributes), 0]
  },
  addCommands() {
    return {
      toggleSuperscript:
        () =>
        ({ chain }: CommandProps) => {
          const command = chain()
          if (this.editor.isActive('subscript')) {
            command.unsetMark('subscript')
          }
          return command.toggleMark('superscript').run()
        },
    }
  },
})

const Subscript = Mark.create({
  name: 'subscript',
  parseHTML() {
    return [{ tag: 'sub' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['sub', mergeAttributes(HTMLAttributes), 0]
  },
  addCommands() {
    return {
      toggleSubscript:
        () =>
        ({ chain }: CommandProps) => {
          const command = chain()
          if (this.editor.isActive('superscript')) {
            command.unsetMark('superscript')
          }
          return command.toggleMark('subscript').run()
        },
    }
  },
})

const CustomTaskItem = TaskItem.extend({
  parseHTML() {
    return [
      {
        tag: `li[data-type="${this.name}"]`,
        priority: 51,
      },
    ]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
      }),
      [
        'label',
        {},
        [
          'input',
          {
            type: 'checkbox',
            checked: node.attrs.checked ? 'checked' : null,
          },
        ],
      ],
      ['div', { class: 'task-item-content' }, 0],
    ]
  },
  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.getAttribute('data-checked') === 'true',
        renderHTML: (attributes) => ({
          'data-checked': attributes.checked,
        }),
      },
    }
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const listItem = document.createElement('li')
      listItem.dataset.type = 'taskItem'
      if (node.attrs.checked) {
        listItem.dataset.checked = 'true'
      }

      const label = document.createElement('label')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = node.attrs.checked
      checkbox.addEventListener('change', (event) => {
        if (typeof getPos === 'function') {
          editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .command(({ tr }) => {
              const pos = getPos()
              tr.setNodeMarkup(pos, undefined, {
                checked: (event.target as HTMLInputElement).checked,
              })
              return true
            })
            .run()
        }
      })

      label.contentEditable = 'false'
      label.appendChild(checkbox)
      listItem.appendChild(label)

      const content = document.createElement('div')
      content.className = 'task-item-content'
      listItem.appendChild(content)

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false
          }
          checkbox.checked = updatedNode.attrs.checked
          if (updatedNode.attrs.checked) {
            listItem.dataset.checked = 'true'
          } else {
            delete listItem.dataset.checked
          }
          return true
        },
      }
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
      TextStyleAttributes,
      HighlightMark,
      Superscript,
      Subscript,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      CustomTaskItem.configure({
        nested: true,
      }),
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
      const { from, to } = editor.state.selection
      editor.commands.setContent(content, false)
      editor.commands.setTextSelection({
        from: Math.min(from, editor.state.doc.content.size),
        to: Math.min(to, editor.state.doc.content.size),
      })
    }
  }, [editor, content, noteId])

  const handleCopyClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      if (target.hasAttribute('data-inline-code-copy')) {
        const codeElement = target.previousElementSibling as HTMLElement | null
        if (codeElement?.textContent) {
          navigator.clipboard.writeText(codeElement.textContent)
          onCopy('Código copiado!')
        }
      } else if (target.hasAttribute('data-code-block-copy')) {
        const wrapper = target.parentElement
        const codeElement = wrapper?.querySelector('code')
        if (codeElement?.textContent) {
          navigator.clipboard.writeText(codeElement.textContent)
          onCopy('Código copiado!')
        }
      }
    },
    [onCopy]
  )

  const toolbar = useMemo(
    () => [
      {
        name: 'Heading 1',
        label: 'H1',
        action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        name: 'Heading 2',
        label: 'H2',
        action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        name: 'Heading 3',
        label: 'H3',
        action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        name: 'Bold',
        label: <strong>B</strong>,
        action: () => editor?.chain().focus().toggleBold().run(),
      },
      {
        name: 'Italic',
        label: <em>I</em>,
        action: () => editor?.chain().focus().toggleItalic().run(),
      },
      {
        name: 'Underline',
        label: <u>U</u>,
        action: () => editor?.chain().focus().toggleUnderline().run(),
      },
      {
        name: 'Strike',
        label: <s>S</s>,
        action: () => editor?.chain().focus().toggleStrike().run(),
      },
      {
        name: 'Inline code',
        label: <CodeIcon className="h-3.5 w-3.5" />,
        action: () => editor?.chain().focus().toggleCode().run(),
      },
      {
        name: 'Code block',
        label: '{ }',
        action: () => editor?.chain().focus().toggleCodeBlock().run(),
      },
      {
        name: 'Bullet list',
        label: '•',
        action: () => editor?.chain().focus().toggleBulletList().run(),
      },
      {
        name: 'Ordered list',
        label: '1.',
        action: () => editor?.chain().focus().toggleOrderedList().run(),
      },
    ],
    [editor]
  )

  if (!editor) {
    return null
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <input
        className="w-full border-none text-2xl font-semibold text-ink-900 placeholder-ink-400 focus:outline-none"
        placeholder="Título da nota"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <div className="mt-6">
        <div className="note-toolbar flex flex-wrap items-center gap-2">
          <button
            title="Align left"
            className="flex h-7 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-100 transition"
            onMouseDown={(e) => {
              e.preventDefault()
              editor?.chain().focus().setTextAlign('left').run()
            }}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            title="Align center"
            className="flex h-7 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-100 transition"
            onMouseDown={(e) => {
              e.preventDefault()
              editor?.chain().focus().setTextAlign('center').run()
            }}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            title="Align right"
            className="flex h-7 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-100 transition"
            onMouseDown={(e) => {
              e.preventDefault()
              editor?.chain().focus().setTextAlign('right').run()
            }}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            title="Justify"
            className="flex h-7 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-100 transition"
            onMouseDown={(e) => {
              e.preventDefault()
              editor?.chain().focus().setTextAlign('justify').run()
            }}
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>
          <div className="color-menu">
            <button className="color-menu-toggle" type="button" tabIndex={0}>
              <CaseSensitive className="h-3.5 w-3.5" />
              <span>Cor</span>
            </button>
            <div className="color-menu-panel">
              <input
                type="color"
                className="color-input"
                title="Escolher cor"
                onChange={(e) => {
                  editor?.chain().focus().setColor(e.target.value).run()
                }}
              />
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().unsetColor().run()
                }}
              >
                Resetar
              </button>
            </div>
          </div>
          <div className="color-menu">
            <button className="color-menu-toggle" type="button" tabIndex={0}>
              <span className="color-swatch" style={{ backgroundColor: '#fde047' }} />
              <span>Marca-texto</span>
            </button>
            <div className="color-menu-panel">
              <input
                type="color"
                className="color-input"
                title="Escolher cor"
                onChange={(e) => {
                  editor?.chain().focus().setHighlight(e.target.value).run()
                }}
              />
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().unsetHighlight().run()
                }}
              >
                Resetar
              </button>
            </div>
          </div>
          <div className="color-menu">
            <button className="color-menu-toggle" type="button" tabIndex={0}>
              <span>Fonte</span>
            </button>
            <div className="color-menu-panel">
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().setFontFamily('sans-serif').run()
                }}
              >
                Sans
              </button>
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().setFontFamily('serif').run()
                }}
              >
                Serif
              </button>
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().setFontFamily('monospace').run()
                }}
              >
                Mono
              </button>
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().unsetFontFamily().run()
                }}
              >
                Resetar
              </button>
            </div>
          </div>
          <div className="color-menu">
            <button className="color-menu-toggle" type="button" tabIndex={0}>
              <span>Tamanho</span>
            </button>
            <div className="color-menu-panel">
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().setFontSize('0.75rem').run()
                }}
              >
                12px
              </button>
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().setFontSize('0.875rem').run()
                }}
              >
                14px
              </button>
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().setFontSize('1rem').run()
                }}
              >
                16px
              </button>
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().setFontSize('1.125rem').run()
                }}
              >
                18px
              </button>
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().setFontSize('1.25rem').run()
                }}
              >
                20px
              </button>
              <button
                className="color-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().unsetFontSize().run()
                }}
              >
                Resetar
              </button>
            </div>
          </div>
          <button
            title="Superscript"
            className="flex h-7 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-100 transition"
            onMouseDown={(e) => {
              e.preventDefault()
              editor?.chain().focus().toggleSuperscript().run()
            }}
          >
            x<sup>2</sup>
          </button>
          <button
            title="Subscript"
            className="flex h-7 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-100 transition"
            onMouseDown={(e) => {
              e.preventDefault()
              editor?.chain().focus().toggleSubscript().run()
            }}
          >
            x<sub>2</sub>
          </button>
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
          <button
            title="Task List"
            className="flex h-7 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-700 hover:bg-slate-100 transition"
            onMouseDown={(e) => {
              e.preventDefault()
              editor?.chain().focus().toggleTaskList().run()
            }}
          >
            ☑
          </button>
          <div className="table-menu">
            <button className="table-menu-toggle" type="button">
              Tabela
            </button>
            <div className="table-menu-panel">
              <button
                className="table-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor
                    ?.chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                }}
              >
                Inserir 3x3
              </button>
              <button
                className="table-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().addRowAfter().run()
                }}
              >
                + Linha
              </button>
              <button
                className="table-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().addColumnAfter().run()
                }}
              >
                + Coluna
              </button>
              <button
                className="table-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().deleteRow().run()
                }}
              >
                - Linha
              </button>
              <button
                className="table-menu-action"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().deleteColumn().run()
                }}
              >
                - Coluna
              </button>
              <button
                className="table-menu-action danger"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor?.chain().focus().deleteTable().run()
                }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="note-editor-scroll mt-6" onClick={handleCopyClick}>
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
        .note-toolbar { position: sticky; top: 72px; z-index: 40; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(6px); padding: 0.5rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; }
        .note-editor-scroll { max-height: calc(100vh - 240px); overflow: auto; overscroll-behavior: contain; }
        .color-input { width: 22px; height: 22px; padding: 0; border: none; background: transparent; }
        .color-input::-webkit-color-swatch-wrapper { padding: 0; }
        .color-input::-webkit-color-swatch { border: 1px solid #cbd5e1; border-radius: 0.25rem; }
        .color-swatch { width: 18px; height: 18px; border-radius: 4px; border: 1px solid #cbd5e1; }
        .color-menu { position: relative; }
        .color-menu-toggle { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #e2e8f0; background: #fff; border-radius: 0.5rem; padding: 0.25rem 0.5rem; font-size: 11px; color: #475569; }
        .color-menu-toggle:hover { background: #f8fafc; }
        .color-menu-panel { position: absolute; top: calc(100% + 6px); left: 0; display: none; align-items: center; gap: 6px; padding: 0.5rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); z-index: 50; }
        .color-menu:focus-within .color-menu-panel { display: flex; }
        .color-menu-action { border: 1px solid #e2e8f0; background: #fff; border-radius: 0.375rem; padding: 0.125rem 0.5rem; font-size: 11px; color: #475569; }
        .color-menu-action:hover { background: #f8fafc; }
        .table-menu { position: relative; }
        .table-menu-toggle { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #e2e8f0; background: #fff; border-radius: 0.5rem; padding: 0.25rem 0.5rem; font-size: 11px; color: #475569; }
        .table-menu-toggle:hover { background: #f8fafc; }
        .table-menu-panel { position: absolute; top: calc(100% + 6px); left: 0; display: none; flex-direction: column; gap: 6px; padding: 0.5rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); z-index: 50; min-width: 140px; }
        .table-menu:focus-within .table-menu-panel { display: flex; }
        .table-menu-action { text-align: left; border: 1px solid #e2e8f0; background: #fff; border-radius: 0.375rem; padding: 0.25rem 0.5rem; font-size: 11px; color: #475569; }
        .table-menu-action:hover { background: #f8fafc; }
        .table-menu-action.danger { color: #b91c1c; border-color: #fecaca; }
        .table-menu-action.danger:hover { background: #fef2f2; }
        .prose mark { color: inherit; }
        .inline-code-group { display: inline-flex; align-items: center; gap: 0.25rem; }
        .inline-code-text { background-color: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.9em; }
        .inline-code-copy { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; background-color: #e2e8f0; border-radius: 0.25rem; border: 1px solid #cbd5e1; cursor: pointer; transition: background-color 0.2s; color: #0f172a; background-image: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%230f172a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='14' height='14' x='8' y='8' rx='2' ry='2'/%3E%3Cpath d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: center; background-size: 10px 10px; }
        .inline-code-copy:hover { background-color: #cbd5e1; }
        .code-block-wrapper { position: relative; margin: 0.75rem 0; max-width: 100%; overflow: hidden; }
        .code-block-copy { position: absolute; top: 0.5rem; right: 0.5rem; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #e2e8f0; border-radius: 0.375rem; border: 1px solid #cbd5e1; cursor: pointer; transition: all 0.2s; z-index: 10; color: #0f172a; background-image: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%230f172a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='14' height='14' x='8' y='8' rx='2' ry='2'/%3E%3Cpath d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: center; background-size: 14px 14px; }
        .code-block-copy:hover { background-color: #cbd5e1; border-color: #94a3b8; }
        .prose .code-block-wrapper pre.code-block { background-color: #f1f5f9; color: #0f172a; padding: 1rem; padding-top: 2.5rem; border-radius: 0.5rem; font-family: monospace; white-space: pre; overflow-x: auto; max-width: 100%; overflow-y: hidden; margin: 0; display: block; }
        .prose .code-block-wrapper pre.code-block code { background: none; color: inherit; padding: 0; font-size: 0.9em; }
        .prose table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
        .prose th, .prose td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; position: relative; }
        .prose th { background: #f8fafc; font-weight: 600; }
        .prose .tableWrapper { overflow-x: auto; }
        .prose .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: #cbd5e1; }
        .prose .resize-cursor { cursor: col-resize; }
        
        /* CHECKLIST STYLES - VERSÃO FINAL CORRIGIDA */
        .prose ul[data-type="taskList"] { 
          list-style: none; 
          padding-left: 0; 
          margin: 0.75rem 0;
        }
        
        .prose li[data-type="taskItem"] { 
          display: flex !important; 
          flex-direction: row !important;
          align-items: flex-start !important;
          gap: 0.5rem;
          margin: 0.25rem 0;
        }
        
        .prose li[data-type="taskItem"] > label { 
          display: inline-flex !important;
          align-items: center;
          flex-shrink: 0;
          margin: 0;
          padding: 0;
          user-select: none;
        }
        
        .prose li[data-type="taskItem"] > label input[type="checkbox"] { 
          width: 16px; 
          height: 16px; 
          margin: 0 !important;
          cursor: pointer;
        }
        
        .prose li[data-type="taskItem"] > .task-item-content {
          flex: 1;
          min-width: 0;
          display: inline-block;
        }
        
        .prose li[data-type="taskItem"] > .task-item-content > p { 
          margin: 0 !important;
          display: inline !important;
        }
        
        .prose li[data-type="taskItem"] > .task-item-content > p:first-child {
          display: inline !important;
        }
        
        /* Sublistas dentro de task items */
        .prose li[data-type="taskItem"] ul,
        .prose li[data-type="taskItem"] ol { 
          margin-top: 0.5rem;
          margin-left: 0;
          display: block;
        }
        
        .prose ul[data-type="taskList"] ul[data-type="taskList"] { 
          margin-left: 1.5rem; 
        }
      `}</style>
    </div>
  )
}

export default NoteEditor
