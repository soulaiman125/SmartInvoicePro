# SmartInvoice Pro — Database (Prisma)

PostgreSQL schema, migrations, and seed data managed with Prisma ORM. The schema mirrors [docs/database-design.md](../docs/database-design.md).

## Setup

```bash
cd database
npm install
cp .env.example .env          # set DATABASE_URL to your Postgres instance

npx prisma migrate dev --name init   # create + apply the initial migration
npm run seed                          # load plans + a demo organization
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run generate` | Generate the Prisma client. |
| `npm run migrate` | Create & apply a dev migration. |
| `npm run migrate:deploy` | Apply migrations in production. |
| `npm run studio` | Open Prisma Studio (DB GUI). |
| `npm run seed` | Run the seed script. |

## Migrations

The initial migration lives in [`prisma/migrations/0_init/`](prisma/migrations/0_init/) and was generated from the schema. To apply it:

```bash
npx prisma migrate deploy          # apply existing migrations (CI / production / Docker)
npx prisma migrate dev --name xyz  # create + apply a new migration during development
```

In Docker, the backend container runs `prisma migrate deploy` automatically on startup (see `backend/docker-entrypoint.sh`).

## Notes

- Two generator blocks emit the Prisma client into both this package and `../backend` so a single `prisma generate` serves both.
- Monetary fields use `BigInt` (minor units, e.g. cents) to avoid floating-point errors.
- Row-Level Security policies and the gap-free numbering lock described in the design doc are applied via SQL in migrations.
