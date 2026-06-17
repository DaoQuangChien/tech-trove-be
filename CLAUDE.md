# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start with auto-reload (development)
npm run build      # Build admin panel
npm run start      # Start without auto-reload (production)
npm run seed:example  # Seed example data via scripts/seed.js
```

No test runner is configured. TypeScript is compiled by Strapi's build system — no separate `tsc` step needed. The `dist/` folder is the compiled output.

## Architecture

This is a **Strapi v5** headless CMS backend (TypeScript). It serves as the API layer for the Tech Trove frontend.

### Database

Defaults to **SQLite** (`.tmp/data.db`). Switch via `DATABASE_CLIENT` env var — also supports MySQL and PostgreSQL with the appropriate env vars (`DATABASE_HOST`, `DATABASE_NAME`, etc.).

### Content Types

All content types live under `src/api/<name>/` following Strapi's standard structure (`content-types/`, `controllers/`, `routes/`, `services/`).

- **Collection types**: `article`, `category`, `product`
- **Single types**: `about`, `global`, `landing-page`
- **Custom API** (no schema): `paste-content` — handles paste image processing

Products and articles support **draft/publish** and **i18n**. `product.content` uses the Tiptap rich-text custom field; `article.content` uses Strapi's native blocks field.

### Components

Reusable components in `src/components/`:
- `blocks/` — image, paragraph, video, note, table (content building blocks)
- `sections/` — hero, best-seller, products-by-category (used in `landing-page` dynamic zone)
- `shared/` — seo, link, menu, menu-item, rich-text, quote, row, location

### Paste Image Handler

When content is pasted into a Tiptap editor in the admin panel, external images are automatically downloaded server-side and re-hosted in Strapi's Media Library.

**Admin frontend** (`src/admin/`):
- `app.tsx` — Strapi admin bootstrap; registers the paste interceptor
- `paste-handler/index.ts` — capture-phase DOM paste listener; orchestrates the flow
- `paste-handler/api.ts` — auth token retrieval, `callProcessEndpoint`, `uploadClipboardFile`
- `paste-handler/editor.ts` — ProseMirror integration: `swapImageUrls` (transaction-based URL swap), `redispatchPaste`
- `paste-handler/toast.ts` — upload progress toast notification

**Server** (`src/api/paste-content/`):
- `routes/paste-upload.ts` — single route: `POST /api/paste-content/process`
- `controllers/paste-upload.ts` — auth check, delegates to service
- `services/paste-upload.ts` — downloads external images, uploads via Strapi's upload plugin, returns `{ html, urlMap, processedCount, errors }`

**Flow:**
1. User pastes HTML — original content is inserted immediately (non-blocking)
2. Frontend sends original HTML to `POST /api/paste-content/process`
3. Server downloads each external image, uploads to Media Library, returns `urlMap: { externalUrl → strapiUrl }`
4. Frontend swaps image `src` attributes in-place via a ProseMirror transaction

**Key implementation notes:**
- Tiptap's image extension has `allowBase64: false` — data URI placeholder images are silently dropped; use real URLs only
- The admin JWT is stored in `localStorage` under `"jwtToken"` as a JSON-quoted string
- Strapi v5's upload service expects `{ filepath, originalFilename, mimetype, size }` (not `path/name/type`)
- ProseMirror exposes the EditorView on the `.ProseMirror` DOM element via `element.pmViewDesc.view`

### Plugins

- `@strapi/plugin-users-permissions` — user auth/JWT
- `@notum-cz/strapi-plugin-tiptap-editor` — rich-text editor for admin panel, configured in `config/plugins.ts` with `default` (full) and `minimal` presets

### Key Config Files

- `config/database.ts` — multi-client DB config
- `config/plugins.ts` — Tiptap editor presets
- `config/middlewares.ts` / `config/server.ts` / `config/api.ts` / `config/admin.ts` — standard Strapi config
- `src/index.ts` — app `register` and `bootstrap` hooks (currently empty)
