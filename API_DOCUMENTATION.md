# SmartInvoice Pro — API Documentation

Base URL: `/api/v1` · Format: JSON · Auth: `Authorization: Bearer <accessToken>`

All data is tenant-scoped to the authenticated user's organization. Monetary
values are integers in **minor units** (cents) and serialized as strings.
Validation errors return `400` with `{ message, issues }` (Zod).

## Conventions
- List endpoints accept `?page` and `?pageSize` and return
  `{ data, page, pageSize, total, totalPages }`.
- Roles: `owner > admin > member > viewer`. Writes require `member`+; member &
  destructive ops require `admin`+.
- Rate limits: auth endpoints 30/15 min; general API 600/15 min.

## Authentication — `/auth`
| Method | Path | Auth | Body / Notes |
|---|---|:---:|---|
| POST | `/signup` | – | `{ email, password, fullName?, organizationName? }` → user+org+tokens |
| POST | `/login` | – | `{ email, password }` → `{ user, organizationId, accessToken, refreshToken }` |
| POST | `/refresh` | – | `{ refreshToken }` → rotated tokens |
| POST | `/forgot-password` | – | `{ email }` → generic message (+`devResetToken` in non-prod) |
| POST | `/reset-password` | – | `{ token, password }` |
| POST | `/logout` | – | `{ refreshToken }` |
| POST | `/logout-all` | ✔ | revoke all sessions |
| GET | `/me` | ✔ | current profile + role |
| PATCH | `/me` | ✔ | `{ fullName?, password? }` |

## Clients — `/clients`
| Method | Path | Role | Notes |
|---|---|:---:|---|
| GET | `/` | any | `?search=&page=&pageSize=&includeArchived=` |
| GET | `/:id` | any | |
| POST | `/` | member+ | `{ name, type, email?, taxId?, billingAddress?, … }` |
| PUT | `/:id` | member+ | partial update |
| DELETE | `/:id` | admin+ | archived if it has invoices, else deleted |

## Products — `/products`
| Method | Path | Role | Notes |
|---|---|:---:|---|
| GET | `/` | any | `?search=&category=&page=&pageSize=&activeOnly=` |
| GET | `/categories` | any | distinct category names |
| GET | `/:id` | any | |
| POST | `/` | member+ | `{ name, currency, unitPrice, sku?, category?, imageUrl?, description?, unit?, trackInventory?, lowStockThreshold? }` |
| PUT | `/:id` | member+ | partial |
| DELETE | `/:id` | admin+ | soft-disable (`isActive=false`) |

## Inventory — `/inventory`
| Method | Path | Role | Notes |
|---|---|:---:|---|
| GET | `/movements` | any | stock movement ledger (paginated) |
| GET | `/low-stock` | any | products at/below threshold |
| GET | `/products/:productId/movements` | any | per-product history |
| POST | `/products/:productId/adjust` | member+ | `{ type: in\|out\|adjustment, quantity, reason?, reference? }` (atomic) |

## Invoices — `/invoices`
| Method | Path | Role | Notes |
|---|---|:---:|---|
| GET | `/` | any | `?status=&clientId=&page=&pageSize=` |
| GET | `/:id` | any | includes items + client |
| POST | `/` | member+ | `{ clientId, currency, issueDate?, dueDate?, notes?, items:[{description, quantity, unitPrice, taxRateBasisPoints?, discountBasisPoints?}] }` → draft |
| PUT | `/:id` | member+ | draft only |
| POST | `/:id/issue` | member+ | assigns gap-free number, locks, decrements stock |
| POST | `/:id/cancel` | member+ | `{ reason? }` → issues credit note |
| DELETE | `/:id` | member+ | draft only |

## Quotations — `/quotations`
| Method | Path | Role | Notes |
|---|---|:---:|---|
| GET | `/` | any | `?status=&clientId=&page=&pageSize=` |
| GET | `/:id` | any | |
| POST | `/` | member+ | `{ clientId, currency, validUntil?, items:[{description, quantity, unitPrice, taxRateBasisPoints?}] }` |
| PUT | `/:id` | member+ | draft/sent only |
| PATCH | `/:id/status` | member+ | `{ status: sent\|accepted\|declined\|expired }` |
| POST | `/:id/convert` | member+ | accepted quote → draft invoice |
| DELETE | `/:id` | member+ | not if accepted |

## Payments — `/payments`
| Method | Path | Role | Notes |
|---|---|:---:|---|
| GET | `/` | any | `?invoiceId=&status=&page=&pageSize=` |
| GET | `/invoice/:invoiceId` | any | payment history for an invoice |
| POST | `/invoice/:invoiceId` | member+ | `{ amount, method, currency?, reference?, paidAt? }` — partial allowed; syncs invoice status |
| GET | `/:id` | any | |
| POST | `/:id/refund` | admin+ | reverses payment, restores balance |

> Online gateways (Stripe/PayPal) are abstracted in `gateway.service.js`
> (`createCheckoutSession`, idempotent `handleWebhook`) and return “not configured”
> until API keys are set.

## Analytics & Reports — `/analytics`
| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard` | revenue, outstanding, counts, invoices-by-status, low-stock, recent invoices |
| GET | `/revenue/monthly?months=12` | revenue per month (chart-ready) |
| GET | `/products/performance?limit=5` | top products by invoiced value |
| GET | `/reports/revenue?from=&to=` | totals + breakdown by method |
| GET | `/reports/clients` | per-client billed/paid/outstanding |
| GET | `/reports/inventory` | stock levels + low-stock flags |

## Health
`GET /api/v1/health` → `{ status, service, time }`
