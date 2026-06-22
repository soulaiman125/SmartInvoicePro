# SmartInvoice Pro — Backend

Node.js + Express REST API with Prisma. Modular structure: `routes → controllers → services → prisma`, with Zod validation, JWT auth, and role-based access control. All data access is tenant-scoped by `organizationId`.

## Setup

```bash
cd backend
npm install
cp .env.example .env          # set JWT secrets and DATABASE_URL
npm run prisma:generate       # generate the Prisma client from ../database schema
npm run dev                   # http://localhost:4000
```

> The Prisma schema is shared and lives in [`../database/prisma/schema.prisma`](../database/prisma/schema.prisma).
> `npm run prisma:generate` (run automatically when you generate from the `database` package too) emits the client into this package's `node_modules`. A harmless `Conflict for env var DATABASE_URL` notice may appear because the shared schema also loads `../database/.env`; both files hold the same value.

## Verify

```bash
node smoke-test.mjs            # routing / auth guard / validation     (no DB needed)
node auth-unit-test.mjs        # JWT, password hashing, RBAC core      (no DB needed)
node auth-integration-test.mjs # full register→refresh→logout-all flow (requires a live DB)
```

## Architecture

```
src/
  config/       env + shared Prisma client
  middleware/   authenticate (JWT), authorize (RBAC), validate (Zod), error handler
  validators/   Zod request schemas per module
  services/     business logic + DB access (tenant-scoped)
  controllers/  thin HTTP handlers
  routes/       route definitions + guards
  utils/        ApiError, jwt, password, pagination, totals, BigInt serializer
  app.js        Express wiring
  server.js     HTTP bootstrap
```

## Roles (RBAC)

`owner` > `admin` > `member` > `viewer`. Writes require `member`+; member/role management and deletes require `admin`+.

## API (all under `/api/v1`)

### Auth — `/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | – | Create user + organization (becomes owner); returns tokens |
| POST | `/login` | – | Authenticate; returns access + refresh tokens |
| POST | `/refresh` | – | Rotate refresh token, issue new access token |
| POST | `/forgot-password` | – | Request a password reset (no email enumeration) |
| POST | `/reset-password` | – | Set a new password using a reset token |
| POST | `/logout` | – | Revoke a single refresh token |
| POST | `/logout-all` | ✔ | Revoke all of the user's sessions (FR-5) |
| GET | `/me` | ✔ | Current user profile + role |
| PATCH | `/me` | ✔ | Update name/password |

### Users & Roles — `/users`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | any | List organization members |
| GET | `/:id` | any | Get a member |
| POST | `/invite` | admin+ | Invite a member with a role |
| PATCH | `/:id/role` | admin+ | Change a member's role |
| DELETE | `/:id` | admin+ | Remove a member |

### Clients — `/clients`
CRUD (`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`). Clients with invoices are archived, not deleted.

### Products — `/products`
CRUD. Delete soft-disables (`isActive=false`) to preserve invoice history.

### Inventory — `/inventory`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/movements` | All stock movements |
| GET | `/low-stock` | Products at/below threshold |
| GET | `/products/:productId/movements` | Movements for a product |
| POST | `/products/:productId/adjust` | Stock in/out/adjustment (atomic) |

### Invoices — `/invoices`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (filter by `status`, `clientId`) |
| GET | `/:id` | Get with line items |
| POST | `/` | Create draft (totals computed server-side) |
| PUT | `/:id` | Update draft only |
| POST | `/:id/issue` | Assign gap-free number, lock, decrement stock |
| POST | `/:id/cancel` | Cancel issued invoice via credit note |
| DELETE | `/:id` | Delete draft only |

### Quotations — `/quotations`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (filter by `status`, `clientId`) |
| GET | `/:id` | Get with line items |
| POST | `/` | Create draft |
| PUT | `/:id` | Update draft/sent |
| PATCH | `/:id/status` | sent / accepted / declined / expired |
| POST | `/:id/convert` | Convert accepted quote → draft invoice |
| DELETE | `/:id` | Delete (not if accepted) |

## Notes

- Money is handled in integer **minor units** (cents); `BigInt` fields serialize to JSON strings.
- Invoice numbering is gap-free and assigned at issue time inside a `Serializable` transaction (BR-1).
- Issued invoices are immutable; corrections go through credit notes.
