# Email Delivery System — SmartInvoice Pro

Phase 2 of the premium upgrade. Sends branded, PDF-attached emails for invoices
and quotes, with full delivery tracking, history and retry.

## Capabilities

| Feature | Status |
| --- | --- |
| Send invoice (PDF attached) | ✅ |
| Send quote (PDF attached) | ✅ |
| Payment reminders (overdue-aware) | ✅ |
| Invoice-paid receipts | ✅ (auto on full payment) |
| Welcome emails | ✅ (auto on registration) |
| Professional HTML templates | ✅ responsive, inline-styled |
| Delivery tracking | ✅ `EmailLog` table |
| Email history | ✅ per-entity + global |
| Retry failed emails | ✅ rebuilds from the entity |

## Architecture

```
controllers/email.controller.js     POST send, history, retry
        │
services/email.service.js           transport, deliver(), dispatch(), retry
        ├── services/email/templates.js   branded HTML/text per type
        ├── services/pdf.service.js        attaches the premium PDF
        └── config/env.js                  SMTP / preview config
        ▼
prisma EmailLog                      queued → sent | failed (attempts tracked)
```

### Transport resolution (`email.service.js`)

The transport is resolved once and reused:

1. **SMTP** — used when `SMTP_HOST` is set (production).
2. **Ethereal preview** — when `EMAIL_PREVIEW=ethereal`; returns a clickable
   preview URL (stored on the log) when the network is reachable.
3. **JSON transport** — the offline-safe default. Serialises the message without
   sending so the full flow (logging, history, retry) works with **zero
   credentials**.

This satisfies the "dev/preview transport, SMTP-ready" model: nothing to
configure for development; set the `SMTP_*` env vars to go live.

### Configuration (env)

```bash
MAIL_FROM="SmartInvoice Pro <no-reply@smartinvoice.pro>"
EMAIL_PREVIEW=json            # or "ethereal"
SMTP_HOST=                    # set to enable real sending
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
APP_URL=http://localhost:5173 # used for links inside emails
```

## Data model — `EmailLog`

| Field | Purpose |
| --- | --- |
| `type` | `invoice` / `quote` / `payment_reminder` / `invoice_paid` / `welcome` |
| `toEmail`, `toName`, `subject` | recipient + subject |
| `entityType`, `entityId` | links the email to its invoice/quote |
| `status` | `queued` → `sent` / `failed` |
| `provider` | `smtp` / `preview` |
| `messageId`, `previewUrl` | transport references |
| `error`, `attempts`, `lastAttemptAt`, `sentAt` | delivery tracking & retry |

## API

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/v1/invoices/:id/email` | Send invoice + PDF (`{ to? }`) |
| POST | `/api/v1/invoices/:id/reminder` | Send payment reminder + PDF |
| POST | `/api/v1/quotations/:id/email` | Send quote + PDF |
| GET | `/api/v1/emails` | History (`?entityType&entityId&status&page`) |
| POST | `/api/v1/emails/:id/retry` | Rebuild & re-send |

`to` is optional — the client's email on file is used by default. Send endpoints
return `202 Accepted` with the resulting `EmailLog` row.

## Automatic emails

These fire **best-effort** (wrapped in try/catch, never blocking the main
operation — the same pattern as the existing in-app notifications):

- **Welcome** — on `auth.service.register`.
- **Payment receipt** — in `payment.service.recordPayment` once an invoice
  becomes fully `paid`.

## Frontend

- **Send by Email** button on invoice & quote detail pages.
- [`EmailModal`](frontend/src/components/EmailModal.jsx) — recipient override,
  send actions (invoice + reminder, or quote), and the **delivery history** list
  with **status badges** (Sent / Queued / Failed) and a **Retry** action on
  failures.
- Hooks: [`useEmails.js`](frontend/src/hooks/useEmails.js).

## Verification

- Unit tests: every template renders subject + HTML + text (`npm test`).
- Functional: all five email types send, log, and retry against seeded data.
- HTTP: `POST /invoices/:id/email` → `202`; `GET /emails` returns history.
