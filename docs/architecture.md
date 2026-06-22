# SmartInvoice Pro — Software Architecture

## 1. Architectural Goals

- **Multi-tenancy** with strong data isolation.
- **Scalability**: stateless services scaled horizontally.
- **Reliability**: gap-free numbering, idempotent payment processing.
- **Extensibility**: pluggable tax/compliance and payment-gateway modules.
- **Security & compliance**: GDPR, PCI-DSS (via tokenization), OWASP.
- **Maintainability**: clear module boundaries, testable billing core.

## 2. Architectural Style

A **modular monolith** for the application backend (fast to build, easy to operate at early stage), with a few **decoupled async workers** and clearly separated bounded contexts. The module boundaries are drawn so that high-load contexts (PDF rendering, notifications, recurring billing) can later be extracted into independent microservices without rewrites.

> Rationale: At MVP scale a microservices fleet adds operational cost without benefit. The modular monolith preserves clean seams; extraction happens only where load or team scaling demands it.

## 3. High-Level System Diagram

```
                         ┌──────────────────────────┐
                         │        Clients           │
                         │  Web SPA  │ Client Portal │
                         └─────┬──────────────┬──────┘
                               │ HTTPS/REST   │
                         ┌─────▼──────────────▼──────┐
                         │      API Gateway / BFF     │
                         │   (auth, rate-limit, CORS) │
                         └─────────────┬──────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │            Application Backend (modular)         │
              │  ┌─────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ │
              │  │ Auth &  │ │ Billing│ │ Clients │ │ Catalog │ │
              │  │ Tenancy │ │  Core  │ │  / CRM  │ │         │ │
              │  └─────────┘ └────┬───┘ └─────────┘ └─────────┘ │
              │  ┌─────────┐ ┌────▼───┐ ┌─────────┐ ┌─────────┐ │
              │  │ Payments│ │ Tax /  │ │Reporting│ │Settings │ │
              │  │ Gateway │ │Compliance│ │        │ │         │ │
              │  └────┬────┘ └────────┘ └─────────┘ └─────────┘ │
              └───────┼───────────────┬──────────────┬──────────┘
                      │               │              │
        ┌─────────────▼───┐   ┌───────▼──────┐  ┌────▼─────────┐
        │  Message Queue  │   │  PostgreSQL  │  │    Redis     │
        │ (jobs/events)   │   │ (primary DB) │  │ (cache/lock) │
        └───────┬─────────┘   └──────────────┘  └──────────────┘
                │
   ┌────────────┼─────────────┬───────────────┬──────────────┐
   │            │             │               │              │
┌──▼───┐   ┌────▼────┐   ┌────▼─────┐    ┌────▼─────┐   ┌────▼────┐
│ PDF  │   │ Email/  │   │Recurring │    │ Reminder │   │ Webhook │
│Render│   │ Notify  │   │ Biller   │    │ Scheduler│   │ Handler │
│Worker│   │ Worker  │   │ Worker   │    │ Worker   │   │ Worker  │
└──────┘   └─────────┘   └──────────┘    └──────────┘   └─────────┘

External: Stripe, PayPal, Email provider (SES/SendGrid), FX rate API, Object storage (S3)
```

## 4. Components & Responsibilities

### 4.1 Frontend
- **Web SPA** (org users): dashboard, invoice editor, clients, settings.
- **Client Portal** (external clients): view/accept quotes, view/pay invoices.
- Technology: **React + TypeScript**, component library, i18n (incl. RTL).
- State/data: React Query for server cache; form validation client-side mirrored server-side.

### 4.2 API Gateway / BFF
- Single HTTPS entry point. Handles authentication, JWT validation, rate limiting, request routing, CORS, and tenant resolution.
- Exposes a **REST/JSON** API (OpenAPI-documented). Optional GraphQL BFF for the SPA later.

### 4.3 Backend Modules (Bounded Contexts)

| Module | Responsibility |
|--------|----------------|
| **Auth & Tenancy** | Signup/login, sessions (JWT + refresh), 2FA, org & membership, RBAC, tenant context. |
| **Billing Core** | Invoices, quotes, line items, numbering, lifecycle, credit notes, immutability rules. |
| **Clients / CRM** | Client records, addresses, contacts, history aggregation. |
| **Catalog** | Products/services, pricing, unit & tax defaults. |
| **Tax / Compliance** | Tax-rate resolution, rounding rules, VAT reporting, e-invoice formats, audit log. |
| **Payments** | Gateway abstraction, checkout sessions, webhook reconciliation, manual & partial payments, refunds. |
| **Reporting** | KPIs, revenue/tax/aging reports, exports. |
| **Settings** | Org identity, branding, defaults, templates. |
| **Platform/Subscription** | Plans, feature flags, quotas, usage metering, super-admin. |

### 4.4 Async Workers
- **PDF Render Worker** — headless renderer turns invoice data + template into PDF, stored in object storage.
- **Email/Notify Worker** — sends transactional emails and in-app notifications.
- **Recurring Biller** — generates invoices from recurring profiles on schedule.
- **Reminder Scheduler** — dispatches overdue reminders per configured rules.
- **Webhook Handler** — processes gateway events idempotently, updates payment/invoice state.

### 4.5 Data Stores
- **PostgreSQL** — primary relational store (strong consistency for money & numbering).
- **Redis** — caching, rate limiting, distributed locks (numbering), session/refresh token store.
- **Object Storage (S3-compatible)** — PDFs, logos, attachments.
- **Message Queue** (e.g., RabbitMQ / SQS) — async jobs & domain events.

## 5. Multi-Tenancy Strategy

**Shared database, shared schema, row-level tenant isolation** via a mandatory `organization_id` on all tenant-scoped tables, enforced by:
- PostgreSQL **Row-Level Security (RLS)** policies, plus
- An application-level tenant context that scopes every query, plus
- Automated tests asserting cross-tenant access is impossible.

> Upgrade path: high-value/enterprise tenants can be moved to a **schema-per-tenant** or dedicated DB without changing the domain model.

## 6. Key Cross-Cutting Concerns

### 6.1 Invoice Numbering Integrity
- Per-org, per-series, per-fiscal-year counters stored in a dedicated table.
- Number assignment happens **at finalization** inside a DB transaction using `SELECT ... FOR UPDATE` (or a Postgres sequence per series) to guarantee gap-free, unique numbers under concurrency.

### 6.2 Payment Idempotency
- Each gateway webhook carries an event id stored in a `processed_webhook_events` table; re-deliveries are no-ops.
- Payment recording is transactional with invoice balance updates.

### 6.3 Security
- TLS everywhere; secrets in a managed vault.
- JWT access tokens (short-lived) + rotating refresh tokens; revocation list in Redis.
- RBAC enforced at the service layer, not just UI.
- No card data stored — gateway tokenization only (PCI-DSS SAQ-A scope).
- Input validation, output encoding, parameterized queries, CSRF protection on portal.
- Audit logging of sensitive actions.

### 6.4 Observability
- Structured logging with tenant/request correlation ids.
- Metrics (RED/USE) and distributed tracing.
- Alerting on error rates, queue depth, webhook failures, numbering anomalies.

### 6.5 Internationalization
- Server-driven locale & currency; FX rates cached daily.
- Templates support multiple languages and RTL.

## 7. API Surface (Representative)

```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/orgs/{orgId}/invitations
GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/products
POST   /api/v1/quotes
POST   /api/v1/quotes/{id}/convert
GET    /api/v1/invoices?status=overdue&page=1
POST   /api/v1/invoices                 # draft
POST   /api/v1/invoices/{id}/issue      # assigns number, locks
POST   /api/v1/invoices/{id}/send
GET    /api/v1/invoices/{id}/pdf
POST   /api/v1/invoices/{id}/payments   # manual/partial
POST   /api/v1/invoices/{id}/credit-notes
POST   /api/v1/recurring-profiles
GET    /api/v1/reports/tax?period=2026Q2
POST   /api/v1/webhooks/stripe          # signed
POST   /api/v1/webhooks/paypal
```

All endpoints are tenant-scoped and require auth except public portal links (signed tokens) and signed webhooks.

## 8. Technology Stack (Recommended)

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React + TypeScript, Vite | SPA + portal, i18n, RTL |
| Backend | Node.js (NestJS) **or** Python (Django/DRF) | Strong typing, modular structure, mature ecosystems |
| Database | PostgreSQL 15+ | RLS, sequences, transactional integrity |
| Cache/Lock | Redis | Sessions, rate limit, locks |
| Queue | RabbitMQ or AWS SQS | Async jobs/events |
| Object storage | S3-compatible | PDFs, assets |
| PDF | Headless rendering (HTML→PDF) | Templated, tested |
| Payments | Stripe + PayPal SDKs | Tokenized, webhooks |
| Email | SES / SendGrid | Transactional + deliverability |
| Infra | Docker + Kubernetes (or managed PaaS) | Autoscaling, rolling deploys |
| CI/CD | GitHub Actions | Test, build, deploy gates |
| IaC | Terraform | Reproducible environments |

## 9. Deployment & Environments

- Environments: **dev → staging → production**, each isolated.
- Stateless app containers behind a load balancer; horizontal autoscaling.
- Managed Postgres with automated backups + PITR; read replica for reporting.
- Blue/green or rolling deployments; DB migrations gated and reversible.
- CDN in front of static assets and the SPA.

## 10. Scalability & Future Evolution

1. Extract **PDF rendering** and **notifications** into independent services first (CPU/IO heavy).
2. Introduce a **read replica** + materialized views for reporting at scale.
3. Move heavy tenants to **dedicated schemas/DBs**.
4. Add an **event bus** (domain events already modeled) for analytics and integrations (webhooks/marketplace).
5. Native mobile apps consuming the same REST API.

## 11. Architectural Decision Records (Summary)

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-1 | Modular monolith over microservices for MVP | Accepted |
| ADR-2 | Shared-schema multi-tenancy with RLS | Accepted |
| ADR-3 | PostgreSQL as system of record for money/numbering | Accepted |
| ADR-4 | Gateway tokenization to keep PCI scope minimal | Accepted |
| ADR-5 | Async workers via message queue for PDF/email/recurring | Accepted |
