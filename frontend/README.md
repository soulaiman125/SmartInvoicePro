# SmartInvoice Pro — Frontend

React + Vite + Tailwind CSS single-page application.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # adjust VITE_API_URL if needed
npm run dev            # http://localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server (proxies `/api` to the backend). |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Preview the production build. |

## Structure

```
src/
  components/   Reusable UI (Layout, ...)
  pages/        Route pages (Dashboard, Invoices, Login)
  services/     API client (axios)
  main.jsx      App entry
  App.jsx       Routes
  index.css     Tailwind directives
```
