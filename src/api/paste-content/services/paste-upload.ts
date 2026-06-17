import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import * as mimeTypes from 'mime-types';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const DOWNLOAD_TIMEOUT_MS = 15_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractExternalImageUrls(html: string): string[] {
  const seen = new Set<string>();
  const $ = cheerio.load(html);
  $('img').each((_, el) => {
    const src =
      $(el).attr('src') ||
      $(el).attr('data-src') ||
      $(el).attr('data-lazy-src');
    if (src && /^https?:\/\//i.test(src)) seen.add(src);
  });
  return Array.from(seen);
}

function rewriteUrls(html: string, replacements: Map<string, string>): string {
  let result = html;
  for (const [original, replacement] of replacements) {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), replacement);
  }
  return result;
}

/** Write buffer to a temp file, upload via Strapi's upload service, clean up. */
async function uploadBuffer(
  strapiInstance: any,
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string | null> {
  const ext = mimeTypes.extension(mimeType) || 'jpg';
  const tmpPath = path.join(
    os.tmpdir(),
    `strapi-paste-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
  );

  fs.writeFileSync(tmpPath, buffer);

  try {
    const uploaded: any[] = await strapiInstance
      .plugins['upload']
      .services.upload.upload({
        data: {},
        files: {
          filepath: tmpPath,
          originalFilename: filename,
          mimetype: mimeType,
          size: buffer.length,
        },
      });

    const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    return (file?.url as string) ?? null;
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  }
}

/** Download an external image and upload it to Strapi. Returns the new URL or null. */
async function downloadAndUpload(
  strapiInstance: any,
  url: string,
): Promise<string | null> {
  const response = await fetch(url, {
    headers: {
      Accept: 'image/*,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; Strapi/1.0)',
    },
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const mimeType = contentType.split(';')[0].trim();

  if (!mimeType.startsWith('image/')) throw new Error(`Not an image (${mimeType})`);

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
  }

  const urlPath = (() => { try { return new URL(url).pathname; } catch { return url; } })();
  const basename = path.basename(urlPath).split('?')[0] || 'image';
  const ext = mimeTypes.extension(mimeType) || 'jpg';
  const filename = basename.includes('.') ? basename : `${basename}.${ext}`;

  return uploadBuffer(strapiInstance, buffer, mimeType, filename);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export default {
  /**
   * Process pasted HTML: download external images server-side and replace
   * their URLs with Strapi-hosted ones.
   *
   * Returns the rewritten HTML, a count of processed images, any per-image
   * errors, and a urlMap ({ originalUrl → strapiUrl }) for the client to
   * perform an in-place swap via ProseMirror transaction.
   */
  async processHtml(
    strapiInstance: any,
    html: string,
  ): Promise<{
    html: string;
    processedCount: number;
    errors: string[];
    urlMap: Record<string, string>;
  }> {
    const errors: string[] = [];
    const replacements = new Map<string, string>();

    for (const url of extractExternalImageUrls(html)) {
      if (replacements.has(url)) continue;
      try {
        const newUrl = await downloadAndUpload(strapiInstance, url);
        if (newUrl) replacements.set(url, newUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${url}: ${msg}`);
        strapiInstance.log.warn(`[PasteContent] Could not process image ${url}: ${msg}`);
      }
    }

    const urlMap: Record<string, string> = Object.fromEntries(replacements);

    return {
      html: replacements.size > 0 ? rewriteUrls(html, replacements) : html,
      processedCount: replacements.size,
      errors,
      urlMap,
    };
  },

  /**
   * Upload a single base64-encoded clipboard image and return its Strapi URL.
   */
  async processClipboardImage(
    strapiInstance: any,
    base64DataUrl: string,
    mimeType: string,
  ): Promise<string | null> {
    if (!mimeType.startsWith('image/')) return null;
    const base64 = base64DataUrl.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const ext = mimeTypes.extension(mimeType) || 'jpg';
    return uploadBuffer(strapiInstance, buffer, mimeType, `clipboard-${Date.now()}.${ext}`);
  },
};
