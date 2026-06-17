/**
 * Auth + API helpers for the paste handler.
 */

/** Read the Strapi admin JWT from localStorage (stored as a JSON-quoted string). */
export function getAdminToken(): string | null {
  try {
    const raw = localStorage.getItem('jwtToken');
    if (raw) {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    const match = document.cookie.match(/(?:^|;\s*)jwtToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function callProcessEndpoint(
  body: Record<string, unknown>,
  token: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch('/api/paste-content/process', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

/** Read a clipboard File (image blob) as a base64 data URL and upload it to Strapi.
 *  Returns the uploaded file's public URL, or null on failure. */
export async function uploadClipboardFile(
  file: File,
  token: string | null,
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await callProcessEndpoint(
          { clipboardImage: reader.result as string, mimeType: file.type },
          token,
        );
        if (!res.ok) { resolve(null); return; }
        const json = await res.json();
        resolve((json.uploadedUrl as string) ?? null);
      } catch { resolve(null); }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
