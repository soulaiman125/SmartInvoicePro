# SmartInvoice Pro — Deployment Guide

Production deployment for a modern, split stack:

- **Frontend** (React + Vite SPA) → **Vercel**
- **Backend** (Node + Express + Prisma) → **Railway** or **Render**
- **Database** (PostgreSQL) → **Neon**

A self-hosted **Docker Compose** path is also included (§5).

---

## 0. Architecture

```
 Browser ──> Vercel (static SPA)  ──HTTPS──>  Railway/Render (API)  ──>  Neon Postgres
                 VITE_API_URL                    /api/v1                  DATABASE_URL
```

The frontend is fully static; all data flows through the API at `VITE_API_URL`.
CORS on the API is restricted to `CLIENT_ORIGIN` (your Vercel URL).

---

## 1. Database — Neon PostgreSQL

1. Create a project at [neon.tech](https://neon.tech) → copy the **pooled** connection string.
2. Ensure it ends with `?sslmode=require`. Example:
   `postgresql://USER:PASS@ep-xxx.neon.tech/smartinvoice?sslmode=require`
3. That string is your `DATABASE_URL` for the backend.

Migrations run automatically on backend boot (`prisma migrate deploy` in
[backend/docker-entrypoint.sh](backend/docker-entrypoint.sh)). To seed demo data
once (optional): `cd database && DATABASE_URL=... npm run seed`.

> The migration history is complete and verified: a fresh database provisions the
> full schema (including `EmailLog` and `PortalToken`) with **zero drift**.

---

## 2. Backend — Railway

Railway builds the backend Docker image ([railway.json](railway.json) → `backend/Dockerfile`).

1. **New Project → Deploy from GitHub repo.** Railway detects `railway.json`.
2. **Variables** — set:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | your Neon string |
   | `CLIENT_ORIGIN` | your Vercel URL (e.g. `https://smartinvoice.vercel.app`) |
   | `APP_URL` | same Vercel URL |
   | `JWT_SECRET` | long random (`openssl rand -hex 32`) |
   | `REFRESH_TOKEN_SECRET` | long random |
   | `MAIL_FROM`, `SMTP_*` | optional (see §6) |

   `PORT` is injected by Railway automatically; the app honors it.
3. Deploy. Health check: `GET /api/v1/health`.

> The API **refuses to boot** in production if `JWT_SECRET` / `REFRESH_TOKEN_SECRET`
> are left at their defaults (see [config/env.js](backend/src/config/env.js)).

## 2-alt. Backend — Render

[render.yaml](render.yaml) is a ready blueprint.

1. **Render → New → Blueprint** → select this repo.
2. Fill the `sync: false` vars in the dashboard: `DATABASE_URL` (Neon),
   `CLIENT_ORIGIN`, `APP_URL` (and `SMTP_*` if sending email). `JWT_SECRET` /
   `REFRESH_TOKEN_SECRET` are auto-generated.
3. Deploy. Health check path `/api/v1/health` is preconfigured.
   (To use Render's own Postgres instead of Neon, uncomment the `databases:`
   block in `render.yaml`.)

---

## 3. Frontend — Vercel

[frontend/vercel.json](frontend/vercel.json) configures the Vite build, SPA
fallback (so client routes like `/pricing` and `/portal/:token` resolve), asset
caching and security headers.

1. **Vercel → Add New Project** → import the repo.
2. **Root Directory: `frontend`** (important — it's a monorepo).
3. **Environment Variables** → `VITE_API_URL` = `https://<your-api-host>/api/v1`
   (the Railway/Render URL). This is a **build-time** variable — redeploy after changing it.
4. Deploy. Vercel auto-detects Vite (`npm run build` → `dist`).

After the first deploy, copy the Vercel URL back into the backend's
`CLIENT_ORIGIN` and `APP_URL`, then redeploy the backend so CORS and email links
are correct.

---

## 4. Production environment variables (reference)

### Backend
| Var | Required | Purpose |
|---|---|---|
| `NODE_ENV` | ✅ | `production` |
| `PORT` | platform | API port (injected by Railway/Render) |
| `DATABASE_URL` | ✅ | Neon Postgres (`?sslmode=require`) |
| `CLIENT_ORIGIN` | ✅ | Frontend origin for CORS |
| `APP_URL` | ✅ | Frontend URL for email/portal links |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | ✅ | Strong random secrets |
| `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_TTL_DAYS` | – | Token lifetimes |
| `RESET_TOKEN_TTL_MINUTES` | – | Password-reset token lifetime |
| `PORTAL_TOKEN_TTL_DAYS` | – | Portal link validity (default 90) |
| `MAIL_FROM`, `EMAIL_PREVIEW`, `SMTP_HOST/PORT/SECURE/USER/PASS` | – | Email (see §6) |

### Frontend
| Var | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | ✅ | Absolute API base incl. `/api/v1` |

Templates: [backend/.env.example](backend/.env.example),
[frontend/.env.production.example](frontend/.env.production.example).

---

## 5. Self-hosted (Docker Compose)

```bash
cp .env.docker.example .env     # edit secrets first
docker compose up --build
# Frontend http://localhost:8080 · API http://localhost:4000/api/v1/health
```

nginx ([frontend/nginx.conf](frontend/nginx.conf)) serves the SPA and proxies
`/api`. The backend container migrates on startup. `trust proxy` is enabled so
client IPs and rate limiting work behind the proxy.

### Local development (no Docker)
```bash
cd database && npm install && cp .env.example .env && npx prisma migrate deploy && npm run seed
cd ../backend  && npm install && cp .env.example .env && npm run prisma:generate && npm run dev
cd ../frontend && npm install && cp .env.example .env && npm run dev
```
> If a local PostgreSQL occupies host port 5432, the Docker DB is shadowed — map it to `5433:5432` and update `DATABASE_URL`.

---

## 6. Email (optional)

Email works with **zero configuration** in any environment: with no `SMTP_HOST`,
a dev/preview transport records every message in the `EmailLog` table without
sending. To send for real, set `SMTP_HOST/PORT/USER/PASS` (e.g. SendGrid,
Postmark, Resend SMTP, Mailgun). See [EMAIL_SYSTEM.md](EMAIL_SYSTEM.md).

---

## 7. Security audit checklist

- [x] Helmet security headers + restricted CORS (`CLIENT_ORIGIN`)
- [x] Rate limiting (stricter on `/auth`) — `express-rate-limit`
- [x] Passwords hashed with bcrypt; refresh/reset/portal tokens stored as SHA-256 hashes
- [x] Input validation on every route (Zod)
- [x] Boot-time guard rejects default secrets in production
- [x] Error handler never leaks stack traces to clients
- [x] RBAC middleware on write/admin routes; tenant scoping by `organizationId`
- [ ] Set strong `JWT_SECRET` / `REFRESH_TOKEN_SECRET` (`openssl rand -hex 32`)
- [ ] Enable Neon backups / PITR
- [ ] Add a real SMTP provider for password-reset & invoice emails
- [ ] Configure Stripe/PayPal keys to enable online payments
- [ ] Centralized logging + uptime monitoring

---

## 8. Post-deploy verification

```bash
curl https://<api-host>/api/v1/health          # {"status":"ok",...}
# open the Vercel URL → register → create an invoice → download PDF → send email
```
