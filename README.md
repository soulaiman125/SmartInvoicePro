# SmartInvoice Pro

A multi-tenant SaaS invoicing & billing platform (comparable to Facturago) for freelancers and SMEs.

## Repository Structure

```
SmartInvoicePro/
├── docs/                 Software engineering analysis (functional, architecture, DB, roadmap)
├── frontend/             React + Vite + Tailwind CSS SPA (+ Dockerfile, nginx.conf)
├── backend/              Node.js + Express REST API (+ Dockerfile, entrypoint)
├── database/             Prisma schema, migrations & seed (PostgreSQL)
├── docker-compose.yml    Full-stack orchestration (db + backend + frontend)
└── .env.docker.example   Environment template for docker compose
```

## Quick Start (Docker — recommended)

Brings up PostgreSQL, the API (runs migrations automatically), and the frontend:

```bash
cp .env.docker.example .env
docker compose up --build
```

- Frontend: http://localhost:8080
- API health: http://localhost:4000/api/v1/health

Stop with `docker compose down` (add `-v` to also drop the database volume).

## Quick Start (local, without Docker)

Run each workspace in its own terminal.

### 1. Database
```bash
cd database
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env          # match DATABASE_URL with database/.env
npm run dev                   # http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev                   # http://localhost:5173
```

The frontend dev server proxies `/api` to the backend on port 4000.

## Documentation

See [docs/README.md](docs/README.md) for the full analysis: functional requirements, user stories, architecture, database design, and roadmap.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express, JWT, Zod, Helmet |
| Database | PostgreSQL, Prisma ORM |
