<div align="center">

# SmartInvoice Pro

### Modern Invoicing & Business Management for Growing Companies

A full-stack, multi-tenant SaaS platform for invoicing, quoting, inventory, payments, expenses and analytics — comparable to Zoho Invoice, FreshBooks and Invoice Ninja.

**Stack:** React + Vite · Node.js + Express · Prisma · PostgreSQL · Tailwind CSS

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Deployment](#-deployment)

</div>

---

## 📖 Overview

SmartInvoice Pro is an enterprise-grade billing platform built as a monorepo. It lets an organization manage its entire revenue workflow — from clients and products through quotes, invoices, recurring billing, payments and expenses — with real-time dashboard analytics, exportable reports, premium PDF documents, email delivery and a secure customer portal. The data model is **multi-tenant**: every record is scoped to an organization, and users can belong to and switch between multiple organizations.

> **Demo login:** `demo@smartinvoice.pro` / `Demo1234!` — seeded with 15 clients, 30 products, 25 invoices, 10 quotes, 20 payments, expenses and recurring schedules across the last 12 months.

---

## ✨ Features

| Module | Highlights |
| --- | --- |
| **Authentication** | JWT access + rotating refresh tokens, bcrypt hashing, password reset, RBAC, multi-org membership |
| **Clients** | CRM with company/individual profiles, search, archive, customer-portal links |
| **Products** | Catalog with pricing, tax rates, categories, search & filters |
| **Inventory** | Real-time stock, automatic movements on issue, low-stock alerts, **stock valuation analytics** |
| **Invoices** | Gap-free numbering, per-line tax/discounts, issue/cancel, search + status + date filters |
| **Quotes** | Acceptance tracking, validity dates, one-click convert to invoice |
| **Recurring invoices** | Weekly/monthly/quarterly/yearly auto-generation, pause/resume, scheduler |
| **Payments** | Partial payments, multiple methods, refunds, receipts |
| **Expenses** | Categorized spend tracking feeding **profit analytics** |
| **Dashboard** | Revenue trend, invoice-status & top-client/product charts, KPIs, revenue-vs-expenses profit |
| **Reports** | Revenue, clients, products, outstanding, payments, financial & inventory — export **CSV / Excel / PDF** |
| **PDF engine** | Premium branded invoices/quotes, company logo, QR code, tax breakdown, multi-page, 2 templates |
| **Email** | Invoice/quote delivery, reminders, payment receipts, welcome — with delivery tracking & retry |
| **Customer portal** | Tokenized public links: view invoices/quotes/payments/balance, download PDFs (no login) |
| **Notifications** | In-app center: invoice issued, payment received, low stock, overdue alerts |
| **Audit log** | Automatic timeline of every authenticated mutation |
| **Multi-organization** | Organization switcher, create orgs, fully isolated data per org |
| **Settings & branding** | Company profile, logo upload, invoice/quote prefixes, brand color, default tax, contact details |
| **UX** | Complete dark mode with system detection, responsive layouts, command palette (⌘K), toasts, skeletons |
| **Marketing site** | Public landing, features, pricing and contact pages |

---

## 🧱 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, TanStack Query, Framer Motion, Recharts, Axios |
| **Backend** | Node.js, Express, Zod (validation), Helmet, express-rate-limit, JWT, bcryptjs |
| **PDF / Email / Export** | PDFKit, qr-image, Nodemailer, ExcelJS |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Tooling** | ESLint, Docker, Vercel, Render / Railway, Neon |

---

## 🏛 Architecture

```
 Browser ──▶ Frontend SPA (Vite)  ──HTTPS──▶  Backend API (Express)  ──▶  PostgreSQL (Prisma)
              VITE_API_URL                      /api/v1                     DATABASE_URL
```

- **Layered backend:** `routes → middleware (auth, RBAC, validation, audit, rate-limit) → controllers → services → Prisma`. Business logic lives in services; controllers stay thin.
- **Multi-tenancy:** every query is scoped by `organizationId` taken from the JWT; switching org re-issues a scoped token.
- **Money:** stored as integer minor units (cents) end-to-end; tax/discounts as basis points.
- **Background jobs:** an in-process scheduler generates due recurring invoices and flags overdue invoices hourly.
- **Frontend:** route-level code splitting (`React.lazy`), TanStack Query for server state, a shared design-system (`components/ui`), and a public marketing site under `src/marketing`.

---

## 📂 Folder Structure

```
SmartInvoicePro/
├── frontend/                React + Vite SPA
│   ├── src/
│   │   ├── pages/           Route pages (Dashboard, Invoices, Expenses, Reports, AuditLog, …)
│   │   ├── components/      UI kit (ui/), modals, layout, charts
│   │   ├── marketing/       Public landing / features / pricing / contact
│   │   ├── services/        API clients (axios)
│   │   ├── hooks/           TanStack Query hooks
│   │   └── context/         Auth, Theme, Toast providers
│   └── vercel.json          SPA + headers config for Vercel
├── backend/                 Node.js + Express API
│   └── src/
│       ├── routes/          Versioned routers (/api/v1/*)
│       ├── controllers/     Thin HTTP handlers
│       ├── services/        Business logic (invoice, payment, pdf, email, recurring, audit, …)
│       ├── middleware/      auth, rbac, validate, audit, rateLimit, error
│       ├── validators/      Zod schemas
│       └── config/          env, prisma client
├── database/                Prisma schema, migrations & seed
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/
│       └── seed.js
├── docker-compose.yml       Full-stack local orchestration
├── render.yaml              Backend blueprint (Render)
├── railway.json             Backend config (Railway)
└── DEPLOYMENT_GUIDE.md      Full deployment walkthrough
```

---

## 🚀 Getting Started

### Prerequisites
Node.js 20+, PostgreSQL 16 (local or hosted), npm.

### Option A — Docker (one command)
```bash
cp .env.docker.example .env       # edit secrets
docker compose up --build
# Frontend http://localhost:8080 · API http://localhost:4000/api/v1/health
```

### Option B — Local development
Run each workspace in its own terminal:

```bash
# 1) Database (Prisma + seed)
cd database && npm install
cp .env.example .env               # set DATABASE_URL
npx prisma migrate deploy && npm run seed

# 2) Backend API
cd ../backend && npm install
cp .env.example .env               # match DATABASE_URL; set secrets
npm run prisma:generate
npm run dev                        # http://localhost:4000

# 3) Frontend
cd ../frontend && npm install
cp .env.example .env
npm run dev                        # http://localhost:5173 (proxies /api → :4000)
```

Then open http://localhost:5173 and log in with the demo account above.

### Common commands
| Where | Command | Purpose |
| --- | --- | --- |
| database | `npm run seed` | Reset & seed demo data (idempotent) |
| database | `npx prisma studio` | Browse the DB |
| backend | `npm run dev` / `npm start` | Run API (watch / prod) |
| backend | `npm test` | Unit tests |
| frontend | `npm run dev` / `npm run build` | Dev server / production build |
| frontend | `npm run lint` | ESLint |

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (`?sslmode=require` on Neon) |
| `NODE_ENV` | ✅ | `development` / `production` |
| `PORT` | – | API port (default 4000; injected by host) |
| `CLIENT_ORIGIN` | ✅ | Frontend origin for CORS |
| `APP_URL` | ✅ | Frontend URL for email/portal links |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | ✅ | Strong random secrets (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_TTL_DAYS` | – | Token lifetimes |
| `RESET_TOKEN_TTL_MINUTES`, `PORTAL_TOKEN_TTL_DAYS` | – | Reset / portal link lifetimes |
| `MAIL_FROM`, `EMAIL_PREVIEW`, `SMTP_HOST/PORT/SECURE/USER/PASS` | – | Email (preview transport if SMTP unset) |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | ✅ (prod) | Absolute API base incl. `/api/v1`. In dev, omit and use the Vite proxy. |

Templates: [`backend/.env.example`](backend/.env.example), [`frontend/.env.production.example`](frontend/.env.production.example).

> The backend **refuses to boot in production** with default JWT secrets — set strong values.

---

## 🗄 Database (Prisma)

```bash
cd database
npx prisma migrate deploy   # apply migrations (prod / CI / first run)
npx prisma migrate dev      # create a new migration (development)
npm run seed                # reset + seed demo data
```

Schema lives in [`database/prisma/schema.prisma`](database/prisma/schema.prisma); the backend generates its client from the same schema. Migrations are complete and verified to provision a fresh database with zero drift.

---

## ☁ Deployment

Production target: **Vercel** (frontend) + **Render or Railway** (backend) + **Neon** (PostgreSQL). See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for the full walkthrough.

1. **Neon** — create a database, copy `DATABASE_URL`.
2. **Backend (Render/Railway)** — deploy from repo ([`render.yaml`](render.yaml) / [`railway.json`](railway.json)); set `DATABASE_URL`, `CLIENT_ORIGIN`, `APP_URL`, and strong secrets. Migrations run on boot.
3. **Frontend (Vercel)** — root directory `frontend`, set `VITE_API_URL` to the backend URL; [`frontend/vercel.json`](frontend/vercel.json) handles SPA routing.
4. Point the backend `CLIENT_ORIGIN`/`APP_URL` at the Vercel URL and redeploy.

---

## 🎓 PFE / Portfolio Notes

- **Multi-tenant SaaS architecture** with per-organization isolation and JWT-scoped tenancy.
- **Clean layered backend** (routes → middleware → controllers → services → ORM) and a documented REST API ([API_DOCUMENTATION.md](API_DOCUMENTATION.md)).
- **Real engineering depth:** atomic gap-free invoice numbering, money-as-minor-units, basis-point tax, transactional stock movements, background scheduler, audit middleware.
- **Production concerns handled:** validation, RBAC, rate limiting, security headers, hashed tokens, error handling, deployment configs, CI-friendly migrations.
- **Demo-ready:** seeded 12 months of data drives convincing dashboards, charts and reports out of the box.

Supporting docs: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) · [PDF_SYSTEM.md](PDF_SYSTEM.md) · [EMAIL_SYSTEM.md](EMAIL_SYSTEM.md) · [CUSTOMER_PORTAL.md](CUSTOMER_PORTAL.md) · [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

<div align="center">

Built by **Soulaiman El Boti** · SmartInvoice Pro

</div>
