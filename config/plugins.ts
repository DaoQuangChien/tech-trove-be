export default () => ({
  "tiptap-editor": {
    enabled: true,
    config: {
      presets: {
        default: {
          heading: true,
          bold: true,
          italic: true,
          underline: true,
          strike: true,
          bulletList: true,
          orderedList: true,
          blockquote: true,
          codeBlock: true,
          textAlign: true,
          link: true,
          table: true,
          mediaLibrary: true,
          textColor: true,
          highlightColor: true,
          superscript: true,
          subscript: true,
          horizontalRule: true,
          history: true,
        },
        minimal: {
          bold: true,
          italic: true,
          underline: true,
          bulletList: true,
          orderedList: true,
          history: true,
        },
      },
    },
  },
});
