/**
 * ProseMirror / Tiptap editor integration.
 *
 * Tiptap's `Editor.createView()` does `this.view.dom.editor = this` after
 * constructing the EditorView, so the live `.ProseMirror` element exposes
 * the Tiptap `Editor` instance via a plain `.editor` property — and from
 * there, `editor.view` is the real EditorView with a working `dispatch`.
 *
 * NOTE: this is *not* the same as `editorEl.pmViewDesc` — that expando is a
 * ProseMirror `ViewDesc`/`NodeViewDesc`, whose constructor never assigns a
 * `.view` property (checked against prosemirror-view's source). Reading
 * `pmViewDesc.view` always returns `undefined`, so any swap logic built on
 * it silently no-ops into a DOM-only fallback that never touches the
 * actual document model — which is the bug this file used to have.
 */
function getPmView(editorEl: Element): any | null {
  return (editorEl as any).editor?.view ?? null;
}

/**
 * Replace external image URLs with their Strapi-hosted equivalents.
 * Uses a ProseMirror transaction when the view is accessible (preferred),
 * and falls back to direct DOM mutation otherwise.
 *
 * `scope` should be a DOM node that stays mounted across the async upload
 * round-trip (e.g. the field's wrapper), NOT the `.ProseMirror` element
 * itself. Tiptap's React binding (RichTextInput) re-mounts the
 * `.ProseMirror` element — moving it into a fresh wrapper div — whenever
 * the underlying `editor` instance is recreated, which can happen while we
 * are awaiting the upload response. A `.ProseMirror` reference captured at
 * paste time can therefore go stale, so we re-query for the live element
 * from a stable ancestor at call time instead of trusting a closure-held
 * reference.
 */
export function swapImageUrls(
  scope: Element,
  urlMap: Record<string, string>,
): void {
  if (Object.keys(urlMap).length === 0) return;

  const editorEl = scope.matches('.ProseMirror')
    ? scope
    : scope.querySelector('.ProseMirror');

  if (!editorEl) {
    console.warn('[PasteHandler] Could not locate live .ProseMirror element for URL swap.');
    return;
  }

  const view = getPmView(editorEl);

  if (view) {
    const { state } = view;
    const tr = state.tr;
    let changed = false;

    state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'image') {
        const newUrl = urlMap[node.attrs.src];
        if (newUrl) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: newUrl });
          changed = true;
        }
      }
    });

    if (changed) { view.dispatch(tr); return; }
  }

  // Fallback: direct DOM mutation (visual update only — does NOT update the
  // saved field value). Surface this loudly since it means the swap will be
  // lost on reload.
  console.warn(
    '[PasteHandler] ProseMirror view unavailable; falling back to DOM-only image swap. ' +
    'The change will NOT be persisted until the document is re-edited with the view accessible.',
  );
  editorEl.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement;
    const newUrl = urlMap[el.src] ?? urlMap[el.getAttribute('src') ?? ''];
    if (newUrl) el.src = newUrl;
  });
}

/**
 * Re-dispatch a synthetic paste event carrying the given HTML so that
 * ProseMirror's own paste handler converts it to document nodes.
 */
export function redispatchPaste(target: Element, html: string): void {
  try {
    const dt = new DataTransfer();
    dt.setData('text/html', html);
    dt.setData('text/plain', html.replace(/<[^>]*>/g, ''));
    target.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }),
    );
  } catch {
    try {
      (target as HTMLElement).focus();
      document.execCommand('insertHTML', false, html);
    } catch { /* nothing we can do */ }
  }
}
