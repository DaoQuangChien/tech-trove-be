# Deploying to Railway with Cloudflare R2 for media

This covers two things: switching media storage from local disk to Cloudflare R2 (required — Railway's filesystem isn't persistent), and deploying the Strapi app itself to Railway.

## 1. Cloudflare R2 setup

1. In the Cloudflare dashboard, go to **R2 → Create bucket**. Name it something like `tech-trove-media`.
2. Under **Settings** for the bucket, enable public access either via:
   - the free `*.r2.dev` subdomain (fastest to set up), or
   - a custom domain you attach to the bucket (better for production — no rate limits, your own domain).
3. Go to **R2 → Manage API tokens → Create API token**. Scope it to "Object Read & Write" on this bucket only. Save the **Access Key ID** and **Secret Access Key** — they're shown once.
4. Note your **Account ID** (top right of the R2 dashboard, or in the URL). Your S3-compatible endpoint is:
   ```
   https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   ```

## 2. Wire R2 into Strapi as the upload provider

R2 is S3-compatible, so Strapi's standard S3 community provider works — no R2-specific package needed.

```bash
npm install @strapi/provider-upload-aws-s3
```

Add to `config/plugins.ts`:

```ts
export default ({ env }) => ({
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3',
      providerOptions: {
        baseUrl: env('R2_PUBLIC_URL'), // your r2.dev URL or custom domain
        rootPath: env('R2_ROOT_PATH', ''),
        s3Options: {
          credentials: {
            accessKeyId: env('R2_ACCESS_KEY_ID'),
            secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
          },
          endpoint: env('R2_ENDPOINT'),
          region: 'auto',
          forcePathStyle: true, // R2 requires path-style requests
          params: {
            Bucket: env('R2_BUCKET'),
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  // ...keep your existing tiptap-editor config below
});
```

Add the R2 domain to the CSP so images actually render in the admin panel and Tiptap editor. In `config/middlewares.ts`, replace the bare `'strapi::security'` string with a configured version:

```ts
export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https://*.r2.dev', 'https://your-custom-domain.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'https://*.r2.dev', 'https://your-custom-domain.com'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

Env vars to add (locally in `.env`, and later in Railway):

```
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_BUCKET=tech-trove-media
R2_PUBLIC_URL=https://<bucket>.<account-id>.r2.dev   # or your custom domain
```

No changes are needed in `src/api/paste-content/services/paste-upload.ts` — it already goes through Strapi's `plugin::upload` service, so once the provider above is configured, pasted images land in R2 automatically.

## 3. Switch the database off SQLite

Railway's container filesystem is not persistent across deploys/restarts, so SQLite (`.tmp/data.db`) will lose data. Add a Postgres database in Railway (`+ New → Database → PostgreSQL`) and point Strapi at it — `config/database.ts` already supports this via `DATABASE_CLIENT`.

```
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}   # Railway can reference the Postgres service directly
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

Also install the Postgres driver:

```bash
npm install pg
```

## 4. Deploy to Railway

1. Push this repo to GitHub if it isn't already.
2. In Railway: **New Project → Deploy from GitHub repo**, pick `tech-trove-be`.
3. Add a Postgres database to the same project (step 3 above), then link its `DATABASE_URL` into the app service's variables.
4. In the app service's **Variables** tab, set:
   ```
   HOST=0.0.0.0
   NODE_ENV=production
   APP_KEYS=<comma-separated random strings>
   API_TOKEN_SALT=<random string>
   ADMIN_JWT_SECRET=<random string>
   JWT_SECRET=<random string>
   TRANSFER_TOKEN_SALT=<random string>
   ENCRYPTION_KEY=<random string>
   DATABASE_CLIENT=postgres
   DATABASE_URL=<from Postgres service>
   DATABASE_SSL=true
   DATABASE_SSL_REJECT_UNAUTHORIZED=false
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   R2_BUCKET=tech-trove-media
   R2_PUBLIC_URL=https://<bucket>.<account-id>.r2.dev
   ```
   Generate the random secrets with `openssl rand -base64 32` (one per variable, `APP_KEYS` needs two comma-separated values).
5. In **Settings → Build**, Railway auto-detects Node and runs `npm install && npm run build`. Set the **Start command** to `npm run start`.
6. Railway injects its own `PORT` — `config/server.ts` already reads `env.int('PORT', 1337)`, so no change needed there.
7. Since Railway sits behind a reverse proxy, add proxy trust so Strapi generates correct absolute URLs. In `config/server.ts`:
   ```ts
   export default ({ env }) => ({
     host: env('HOST', '0.0.0.0'),
     port: env.int('PORT', 1337),
     app: { keys: env.array('APP_KEYS') },
     proxy: true,
     url: env('PUBLIC_URL'), // e.g. https://your-app.up.railway.app, set after first deploy
   });
   ```
8. Deploy. Once live, visit `<railway-domain>/admin` to create your first admin user.
9. Add `PUBLIC_URL` to Railway variables with the assigned `*.up.railway.app` domain (or your custom domain once attached), then redeploy so Strapi's absolute URLs are correct.

## 5. Verify

- Upload an image via the Media Library in `/admin` and confirm the resulting URL points at your R2 domain, not local `/uploads/`.
- Test the paste-image flow in the Tiptap editor (paste content with an external image) and confirm it lands in R2 too.
- Confirm content persists after a redeploy (proves Postgres is actually wired up, not falling back to SQLite).
