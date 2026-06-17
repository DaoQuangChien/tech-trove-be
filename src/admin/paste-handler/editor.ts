/**
 * ProseMirror / Tiptap editor integration.
 *
 * ProseMirror stores a ViewDesc on every DOM node it manages via `pmViewDesc`.
 * The root descriptor (on the .ProseMirror element itself) exposes the
 * EditorView directly, giving us a proper transaction API without needing
 * access to the Tiptap editor instance.
 */

function getPmView(editorEl: Element): any | null {
  return (editorEl as any).pmViewDesc?.view ?? null;
}

/**
 * Replace external image URLs with their Strapi-hosted equivalents.
 * Uses a ProseMirror transaction when the view is accessible (preferred),
 * and falls back to direct DOM mutation otherwise.
 */
export function swapImageUrls(
  editorEl: Element,
  urlMap: Record<string, string>,
): void {
  if (Object.keys(urlMap).length === 0) return;

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

  // Fallback: direct DOM mutation (visual update only)
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
