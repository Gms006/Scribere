import '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textStyleAttributes: {
      setColor: (color: string) => ReturnType
      unsetColor: () => ReturnType
      setFontSize: (fontSize: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
    highlight: {
      setHighlight: (color: string) => ReturnType
      toggleHighlight: (color: string) => ReturnType
      unsetHighlight: () => ReturnType
    }
    superscript: {
      toggleSuperscript: () => ReturnType
    }
    subscript: {
      toggleSubscript: () => ReturnType
    }
  }
}
