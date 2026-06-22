# Customer Portal — SmartInvoice Pro

Phase 3 of the premium upgrade. A secure, tokenized, public portal where a
client can view and download their invoices, quotes and payment history — with
no login required.

## Capabilities

- View issued **invoices** and download their PDFs
- View **quotations** and download their PDFs
- View **payment history**
- Account **summary** (total billed / paid / outstanding)
- Branded, **mobile-friendly** UI

## Security model

Access is granted by an opaque, single-use-style **token in the URL** — there is
no session or password.

- A token is **32 random bytes** (`crypto.randomBytes`), surfaced once at
  creation as `…/portal/<token>`.
- Only the **SHA-256 hash** is stored (`PortalToken.tokenHash`), so a database
  leak cannot reconstruct a working link.
- Tokens **expire** after `PORTAL_TOKEN_TTL_DAYS` (default 90; `0` = never) and
  can be **revoked** at any time.
- Every access updates `lastAccessedAt` (best-effort audit trail).
- All portal data is **scoped to the token's client and organization**; a token
  can only ever read that one client's non-draft documents.
- Public routes carry **no auth middleware** by design and live under the
  rate-limited `/api/v1` namespace.

## Data model — `PortalToken`

| Field | Purpose |
| --- | --- |
| `organizationId`, `clientId` | scope of the link |
| `tokenHash` (unique) | SHA-256 of the raw token |
| `label` | optional human label |
| `expiresAt`, `revokedAt`, `lastAccessedAt` | lifecycle & audit |

## API

### Authenticated (link management, mounted under clients)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/clients/:id/portal-links` | List links (with `active` flag) |
| POST | `/api/v1/clients/:id/portal-links` | Create a link → returns raw `url`/`token` once |
| DELETE | `/api/v1/clients/:id/portal-links/:linkId` | Revoke a link |

### Public (token only — no authentication)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/portal/:token` | Client + invoices + quotes + payments + summary |
| GET | `/api/v1/portal/:token/invoices/:id/pdf` | Stream an invoice PDF |
| GET | `/api/v1/portal/:token/quotes/:id/pdf` | Stream a quote PDF |

Invalid, expired or revoked tokens return **401**.

## Frontend

- Public route `/portal/:token` (outside the authenticated app shell) →
  [`Portal.jsx`](frontend/src/pages/Portal.jsx). Branded header (org logo +
  brand colour), summary cards, invoice/quote/payment lists, PDF links, and
  graceful loading / invalid-link states.
- [`PortalLinkCard`](frontend/src/components/PortalLinkCard.jsx) on the client
  detail page: generate (auto-copies to clipboard), copy, and revoke links.
- Service: [`portal.service.js`](frontend/src/services/portal.service.js) — a
  bare axios client (no auth interceptor) for the public calls plus authenticated
  management calls.

## Verification

- Functional: create link → fetch data → render invoice PDF (valid `%PDF-`).
- Security: a random/invalid token is **rejected**; a **revoked** token is
  rejected.
- HTTP: `GET /portal/:token` → `200` with scoped client data.
