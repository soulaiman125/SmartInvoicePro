# SmartInvoice Pro — Database Design

## 1. Overview

The system of record is **PostgreSQL**. The design favors transactional integrity for money-related entities (invoices, payments, numbering) and enforces multi-tenant isolation through a mandatory `organization_id` on every tenant-scoped table, backed by Row-Level Security (RLS).

Conventions:
- All tables use UUID primary keys (`id`).
- Timestamps: `created_at`, `updated_at` (UTC). Soft delete via `deleted_at` where applicable.
- Monetary amounts stored as integers in **minor units** (e.g., cents) plus a `currency` (ISO 4217) to avoid floating-point errors.
- Every tenant-scoped table includes `organization_id` (FK → organizations).

## 2. Entity-Relationship Diagram (Textual)

```
organizations 1───* users (via memberships)
organizations 1───* memberships *───1 users
organizations 1───* clients
organizations 1───* products
organizations 1───* invoices 1───* invoice_items
organizations 1───* quotes   1───* quote_items
clients       1───* invoices
clients       1───* quotes
quotes        0..1─1 invoices            (converted_from)
invoices      1───* payments
invoices      1───* credit_notes 1───* credit_note_items
invoices      0..1─1 recurring_profiles  (template/source)
organizations 1───* tax_rates
organizations 1───* numbering_series
organizations 1───1 subscriptions *───1 plans
organizations 1───* audit_logs
organizations 1───* notifications
```

## 3. Core Tables

### 3.1 organizations
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | text | Legal/display name |
| legal_tax_id | text | VAT / tax registration number |
| country_code | char(2) | ISO 3166 |
| base_currency | char(3) | ISO 4217 |
| address | jsonb | Structured address |
| logo_url | text | Object storage URL |
| default_tax_rate_id | UUID FK → tax_rates | nullable |
| default_payment_terms_days | int | e.g., 30 |
| timezone | text | IANA tz |
| settings | jsonb | Branding, template, footer text |
| created_at / updated_at | timestamptz | |

### 3.2 users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | citext UNIQUE | |
| password_hash | text | Argon2/bcrypt |
| full_name | text | |
| is_email_verified | bool | |
| totp_secret | text | nullable (2FA) |
| created_at / updated_at | timestamptz | |

### 3.3 memberships (user ↔ organization with role)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| user_id | UUID FK | |
| role | enum | owner, admin, member, viewer |
| status | enum | active, invited, disabled |
| invited_email | citext | for pending invites |
| created_at / updated_at | timestamptz | |
| | | UNIQUE(organization_id, user_id) |

### 3.4 clients
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| type | enum | individual, company |
| name | text | |
| email | citext | |
| tax_id | text | nullable |
| billing_address | jsonb | |
| shipping_address | jsonb | nullable |
| preferred_currency | char(3) | nullable |
| preferred_language | text | nullable |
| notes | text | |
| archived_at | timestamptz | soft archive (cannot hard-delete if invoiced) |
| created_at / updated_at | timestamptz | |

### 3.5 products
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| name | text | |
| description | text | |
| sku | text | nullable |
| unit_price | bigint | minor units |
| currency | char(3) | |
| tax_rate_id | UUID FK → tax_rates | nullable |
| unit | enum | unit, hour, day, item |
| category | text | nullable |
| is_active | bool | |
| created_at / updated_at | timestamptz | |

### 3.6 tax_rates
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| name | text | e.g., "VAT 20%" |
| rate_basis_points | int | 2000 = 20.00% |
| is_inclusive | bool | tax-inclusive pricing |
| country_code | char(2) | nullable |
| is_active | bool | |

### 3.7 numbering_series
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| doc_type | enum | invoice, quote, credit_note |
| prefix | text | e.g., "INV-2026-" |
| fiscal_year | int | |
| next_number | bigint | last assigned + 1 |
| padding | int | zero-pad width |
| | | UNIQUE(organization_id, doc_type, fiscal_year) |

> Number assignment locks the row (`SELECT ... FOR UPDATE`) inside the issue transaction to guarantee gap-free, unique sequences under concurrency.

## 4. Billing Tables

### 4.1 invoices
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| client_id | UUID FK | |
| number | text | NULL while Draft; assigned at issue |
| series_id | UUID FK → numbering_series | |
| status | enum | draft, sent, viewed, partially_paid, paid, overdue, cancelled |
| issue_date | date | |
| due_date | date | |
| currency | char(3) | fixed at creation |
| fx_rate | numeric(18,8) | snapshot vs base currency |
| subtotal | bigint | minor units |
| discount_total | bigint | |
| tax_total | bigint | |
| total | bigint | |
| amount_paid | bigint | |
| balance_due | bigint | total − amount_paid |
| notes | text | |
| footer | text | |
| converted_from_quote_id | UUID FK → quotes | nullable |
| recurring_profile_id | UUID FK | nullable |
| issued_at | timestamptz | finalization time (immutable thereafter) |
| created_at / updated_at | timestamptz | |
| | | UNIQUE(organization_id, number) where number NOT NULL |

### 4.2 invoice_items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| invoice_id | UUID FK | |
| product_id | UUID FK | nullable (snapshot below) |
| description | text | |
| quantity | numeric(14,4) | |
| unit_price | bigint | minor units (snapshot) |
| tax_rate_basis_points | int | snapshot |
| discount_basis_points | int | line discount |
| line_subtotal | bigint | |
| line_tax | bigint | |
| line_total | bigint | |
| position | int | ordering |

> Item rows snapshot price/tax/description so historical invoices remain unchanged if catalog items change.

### 4.3 quotes / quote_items
Mirror invoices/invoice_items with:
- `quotes.status` enum: draft, sent, accepted, declined, expired.
- `quotes.valid_until` date.
- `quotes.accepted_at`, `declined_at` timestamps.

### 4.4 credit_notes / credit_note_items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| invoice_id | UUID FK | original invoice |
| number | text | own numbering series |
| reason | text | |
| total | bigint | |
| issued_at | timestamptz | |
Items mirror invoice_items structure.

## 5. Payments

### 5.1 payments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| invoice_id | UUID FK | |
| amount | bigint | minor units (supports partial) |
| currency | char(3) | |
| method | enum | card, paypal, bank_transfer, cash, cheque, other |
| status | enum | pending, succeeded, failed, refunded |
| gateway | enum | stripe, paypal, manual |
| gateway_payment_id | text | nullable |
| paid_at | timestamptz | |
| reference | text | manual reference |
| created_at / updated_at | timestamptz | |

### 5.2 processed_webhook_events (idempotency)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| gateway | enum | stripe, paypal |
| event_id | text | UNIQUE(gateway, event_id) |
| processed_at | timestamptz | |

### 5.3 recurring_profiles
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| client_id | UUID FK | |
| template | jsonb | line items & settings snapshot |
| frequency | enum | daily, weekly, monthly, yearly |
| interval | int | every N periods |
| start_date | date | |
| end_date | date | nullable |
| occurrences_limit | int | nullable |
| occurrences_done | int | |
| auto_send | bool | |
| status | enum | active, paused, cancelled |
| next_run_at | timestamptz | |

## 6. Platform / SaaS Tables

### 6.1 plans
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| code | text | free, pro, business |
| name | text | |
| price_minor | bigint | per period |
| currency | char(3) | |
| limits | jsonb | invoices/month, users, storage |
| features | jsonb | feature flags |

### 6.2 subscriptions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| plan_id | UUID FK | |
| status | enum | trialing, active, past_due, canceled |
| stripe_subscription_id | text | |
| current_period_end | timestamptz | |
| created_at / updated_at | timestamptz | |

### 6.3 usage_counters
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| period | text | e.g., 2026-06 |
| invoices_issued | int | |
| storage_bytes | bigint | |
| | | UNIQUE(organization_id, period) |

## 7. Supporting Tables

### 7.1 audit_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| actor_user_id | UUID FK | nullable (system) |
| action | text | e.g., invoice.issued |
| entity_type | text | |
| entity_id | UUID | |
| metadata | jsonb | before/after, ip, etc. |
| created_at | timestamptz | |

### 7.2 notifications
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| user_id | UUID FK | recipient |
| type | text | payment_received, invoice_overdue, etc. |
| payload | jsonb | |
| read_at | timestamptz | nullable |
| created_at | timestamptz | |

### 7.3 attachments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| entity_type | text | invoice, quote |
| entity_id | UUID | |
| file_url | text | object storage |
| filename | text | |
| size_bytes | bigint | |
| created_at | timestamptz | |

## 8. Indexing Strategy

| Table | Index |
|-------|-------|
| All tenant tables | `(organization_id)` leading on most indexes |
| invoices | `(organization_id, status)`, `(organization_id, client_id)`, `(organization_id, due_date)`, UNIQUE `(organization_id, number)` |
| invoice_items | `(invoice_id, position)` |
| payments | `(organization_id, invoice_id)`, `(gateway, gateway_payment_id)` |
| clients | `(organization_id, email)`, `(organization_id, archived_at)` |
| numbering_series | UNIQUE `(organization_id, doc_type, fiscal_year)` |
| processed_webhook_events | UNIQUE `(gateway, event_id)` |
| audit_logs | `(organization_id, created_at)`, `(entity_type, entity_id)` |

## 9. Data Integrity & Constraints

- **Money**: all amounts `bigint` (minor units); `CHECK (amount >= 0)` where appropriate.
- **Invoice immutability**: enforced in application + DB trigger blocking updates to issued invoices except status/payment fields.
- **Balance rule**: `balance_due = total - amount_paid`; payment insert updates atomically; `CHECK (amount_paid <= total)` (overpay → credit).
- **Referential integrity**: FKs with `ON DELETE RESTRICT` for invoiced clients; archive instead of delete.
- **Numbering**: unique per series/year; assigned only at issue under row lock.
- **RLS**: policies on every tenant table restrict rows to the current `organization_id` from the session/JWT context.

## 10. Migrations & Lifecycle

- Versioned, forward-only migrations (with reversible scripts where safe).
- Seed data: default tax rates per country, default plans.
- Backups: automated daily + point-in-time recovery; periodic restore drills.
- Reporting: read replica + optional materialized views for dashboards/aging.
- Retention: audit logs retained per compliance policy; GDPR export/delete jobs operate per-organization.
