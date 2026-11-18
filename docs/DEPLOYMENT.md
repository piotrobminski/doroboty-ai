# Run the DoRoboty.ai production bundle

This archive contains the optimized frontend, a standalone HTTP/API server and the prepared synthetic scenario. Install **Node.js 24** on the destination server. No npm install, build tools, external database or provider key is required there. The same archive works with Node.js 24 on Linux, macOS or Windows; it includes no native node_modules.

## Extract and start

```sh
tar -xzf doroboty-ai-production.tar.gz
cd doroboty-ai
HOST=0.0.0.0 PORT=3001 node server.mjs
```

Open `http://SERVER_IP:3001/`. `npm start` is equivalent to `node server.mjs`. For a local check, use `HOST=127.0.0.1`. On Windows PowerShell set variables with `$env:HOST='0.0.0.0'; $env:PORT='3001'` before running `node server.mjs`.

The server binds all interfaces on port 3001 by default. Configure the host firewall/reverse proxy for your chosen port. Run it as an unprivileged user with write access to the database directory. Keep the process running with your server's service manager; SIGTERM/SIGINT drain requests for up to ten seconds and close SQLite. This is a compiled deployment of the teaching prototype, with the existing synthetic accounts and product limitations.

## Configuration

| Variable              | Default                 | Meaning                                                                                                                                              |
| --------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HOST`                | `0.0.0.0`               | Interface/address to bind. Use `127.0.0.1` behind a local reverse proxy.                                                                             |
| `PORT`                | `3001`                  | HTTP port, 1–65535.                                                                                                                                  |
| `DATABASE_PATH`       | `.data/doroboty.sqlite` | Persistent SQLite file. Relative paths resolve from the extracted bundle directory. Prefer an absolute path outside the release folder for upgrades. |
| `AUTH_SECURE_COOKIE`  | `0`                     | Set `1` when the browser accesses the app through HTTPS.                                                                                             |
| `AUTH_ADMIN_PASSWORD` | Unset                   | Temporary password used once to provision the primary administrator.                                                                                 |

Configuration comes from the process environment. The standalone server does not load `.env.local` or call the optional local-only OpenAI gateway. The current recruiter proposals work locally without a provider; `/api/recruiter-ai` is unavailable in this bundle.

## HTTPS reverse proxy

Terminate HTTPS at a reverse proxy, forward the **original Host header**, and forward the entire site, including `/api/`, to this server. For example, launch the app with:

```sh
HOST=127.0.0.1 PORT=3001 AUTH_SECURE_COOKIE=1 DATABASE_PATH=/var/lib/doroboty/doroboty.sqlite node server.mjs
```

Inside an existing nginx HTTPS server block, use:

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $http_host;
}
```

The API validates Origin against the original Host and the scheme selected by AUTH_SECURE_COOKIE. HTTPS requires `1`; direct HTTP requires `0`. Do not strip the browser's Origin header. Serve the app at the origin root; navigation uses hash routes. Keep one Node process and a persistent local database volume for this SQLite deployment. The existing login limiter uses the direct socket address; behind a proxy, failed-login limits are shared by clients using that proxy. Forwarded IP headers are not trusted.

## Accounts and persistence

Before starting a fresh Node deployment, set `AUTH_ADMIN_PASSWORD` in the service environment to provision `piotr.obminski@allegro.com`. The server requires rotation on first login. Keep this value in server configuration. Reopening an initialized store preserves its administrator's password. The panel is available at `/#/app/admin` after rotation.

A fresh database also seeds the five synthetic accounts with password `Test1234`:

- `candidate-anna@doroboty.test`
- `candidate-marek@doroboty.test`
- `employer-brightlabs@doroboty.test`
- `employer-northstar@doroboty.test`
- `operator@doroboty.test`

The archive excludes this developer machine's database, sessions, backups and secrets. It starts with the prepared scenario, not the current local edits. Existing databases selected by DATABASE_PATH are retained; databases at schema versions 1 through 4 migrate to version 5 transactionally with a private backup. Do not place the database in `public/`; startup rejects that configuration. The former operator is a candidate. Administrators can set temporary passwords and grant access. Public registration is unavailable. Use synthetic data and restrict access to the intended audience.

To transfer scenario content intentionally, use the operator's confirmed JSON export/import. It excludes passwords and sessions. To preserve an exact existing database, stop every process using it, privately copy the database directory including sidecars to the destination, set DATABASE_PATH to that copy and start the app. Do not put these private files inside the distributable archive or public directory.

For backups/upgrades, stop the service and preserve the complete database directory, including WAL/SHM sidecars and migration backups. Extract a new release separately and point it at the same external DATABASE_PATH; do not overwrite the database with a fresh seed. Retain a pre-upgrade backup and old release for recovery. Restore backups to a separate database path with all writers stopped.

## Password recovery

To enable email delivery, set these variables in the Node service environment and restart it.

| Variable                | Value                                                 |
| ----------------------- | ----------------------------------------------------- |
| `AUTH_RESET_DELIVERY`   | `email`                                               |
| `AUTH_RESET_ORIGIN`     | The browser-facing HTTPS origin, without a path       |
| `AUTH_RESET_EMAIL_FROM` | A sender authorized for the configured Resend account |
| `AUTH_RESET_RESEND_KEY` | A private Resend API key authorized to send email     |

Keep the key on the server. Set `AUTH_SECURE_COOKIE=1` for the HTTPS origin and preserve the request Host through the proxy. The service sends recovery links only to the stored address, and skips example addresses ending in `.test`. Confirm delivery with an inbox controlled by the test operator. The provider receives the recipient address and reset link. [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).

For a loopback installation, `AUTH_RESET_DELIVERY=local` writes messages to the private `.data/password-reset-mail/<port>/` directory. The configured origin must use loopback HTTP. Leave `AUTH_RESET_DELIVERY` unset to disable forgotten-password recovery.

## Verify the release

Alongside the archive, `doroboty-ai-production.tar.gz.sha256` records its SHA-256 checksum. On Linux run `sha256sum -c doroboty-ai-production.tar.gz.sha256`; on macOS use `shasum -a 256 -c doroboty-ai-production.tar.gz.sha256`. The extracted `manifest.json` lists hashes of the packaged files. It excludes database files created at runtime.

After startup:

```sh
curl --fail http://127.0.0.1:3001/
curl --fail http://127.0.0.1:3001/api/state
```

Then log in, make a synthetic change and verify it survives a service restart. Local bundle tests do not establish remote deployment, HTTPS configuration, CI or course-release approval.

To rebuild from the source checkout, run `npm ci` and `npm run bundle:production` with Node.js 24. Output is `artifacts/production/doroboty-ai-production.tar.gz` and its checksum. Packaging uses an allowlist of built public files, the bundled server and this guide; source history, instructor material, environment files and local runtime state are excluded.
