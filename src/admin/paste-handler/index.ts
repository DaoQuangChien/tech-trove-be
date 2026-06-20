/**
 * Capture-phase paste interceptor for Tiptap editors.
 *
 * Flow for HTML pastes with external images:
 *  1. Insert original HTML immediately — user sees content right away.
 *  2. Upload external images to Strapi's Media Library in the background.
 *  3. Swap external URLs for Strapi-hosted ones via a ProseMirror transaction.
 *
 * Flow for direct clipboard images (screenshots etc.):
 *  1. Upload to Strapi, then insert an <img> pointing to the hosted URL.
 */

import { getAdminToken, callProcessEndpoint, uploadClipboardFile } from './api';
import { showToast } from './toast';
import { swapImageUrls, redispatchPaste } from './editor';

const EXTERNAL_IMG_RE = /<img\b[^>]*\bsrc=["']https?:\/\//i;

function extractExternalUrls(html: string): string[] {
  return [
    ...new Set(
      [...html.matchAll(/<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi)].map(
        (m) => m[1],
      ),
    ),
  ];
}

export function setupPasteInterceptor(): void {
  let isRedispatching = false;

  document.addEventListener(
    'paste',
    async (e: ClipboardEvent) => {
      if (isRedispatching) return;

      const editorEl = (e.target as Element | null)?.closest?.('.ProseMirror');
      if (!editorEl || !e.clipboardData) return;

      // Stable ancestor that survives Tiptap re-mounting the `.ProseMirror`
      // element into a fresh wrapper (see editor.ts swapImageUrls for why).
      // Strapi's field wrapper carries `id="<fieldName>"`; fall back to a
      // generic ancestor walk if that's ever not the case.
      const fieldScope =
        editorEl.closest('[id]:not(.ProseMirror)') ?? editorEl.parentElement ?? editorEl;

      const html = e.clipboardData.getData('text/html');
      const imageFiles = Array.from(e.clipboardData.files).filter((f) =>
        f.type.startsWith('image/'),
      );

      const hasExternalImages = EXTERNAL_IMG_RE.test(html);
      const hasClipboardImages = imageFiles.length > 0;

      if (!hasExternalImages && !hasClipboardImages) return;

      e.preventDefault();
      e.stopPropagation();

      const token = getAdminToken();

      // ── Direct clipboard image (e.g. screenshot) ───────────────────────────
      if (hasClipboardImages && !hasExternalImages) {
        const hideToast = showToast(
          `Uploading ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}…`,
        );
        try {
          const tags: string[] = [];
          for (const file of imageFiles) {
            const url = await uploadClipboardFile(file, token);
            if (url) tags.push(`<img src="${url}" />`);
          }
          isRedispatching = true;
          try { redispatchPaste(editorEl, tags.join('\n') || ''); }
          finally { isRedispatching = false; }
        } finally {
          hideToast();
        }
        return;
      }

      // ── HTML paste with external images ────────────────────────────────────

      // 1. Insert immediately so the user isn't waiting
      isRedispatching = true;
      try { redispatchPaste(editorEl, html); }
      finally { isRedispatching = false; }

      const uniqueUrls = extractExternalUrls(html);
      if (uniqueUrls.length === 0) return;

      // 2. Upload in background
      const hideToast = showToast(
        `Uploading ${uniqueUrls.length} image${uniqueUrls.length > 1 ? 's' : ''}…`,
      );

      try {
        const res = await callProcessEndpoint({ html }, token);
        if (!res.ok) {
          console.warn('[PasteHandler] Server returned', res.status);
          return;
        }
        const { urlMap = {} } = await res.json();

        // 3. Swap external URLs for Strapi-hosted ones. Use `fieldScope`
        //    (not `editorEl`) so we re-locate the live `.ProseMirror` node
        //    even if it was re-mounted while we awaited the upload above.
        swapImageUrls(fieldScope, urlMap);
      } catch (err) {
        console.error('[PasteHandler] Background upload failed:', err);
      } finally {
        hideToast();
      }
    },
    true, // capture phase — runs before ProseMirror's own paste handler
  );
}
