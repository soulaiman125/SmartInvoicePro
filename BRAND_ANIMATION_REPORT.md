# BRAND & ANIMATION UPGRADE — SmartInvoice Pro

**Goal:** Make the SmartInvoice Pro logo the centerpiece of a memorable, premium
SaaS identity, and apply elegant, subtle motion across the whole product.
**Inspiration:** Stripe · Linear · Notion · Framer
**Backend:** untouched.
**Date:** 2026-06-21

---

## 1. Result at a glance
- **Build:** ✅ `vite build` clean (~4.3s)
- **Lint:** ✅ `eslint` — 0 problems
- **Runtime:** ✅ dev server boots, HTTP 200, no console errors
- **Motion budget:** all animations are short (0.2–1.2s), transform/opacity-only
  (GPU-friendly), and honor `prefers-reduced-motion`.

---

## 2. The animated logo system (centerpiece)

The brand identity — **S monogram + cyan growth arrow + invoice document** — is
now a living, reusable component, not a static SVG.

| Component | File | What it does |
|---|---|---|
| `BrandMark` | `components/brand/BrandMark.jsx` | The animated icon. Document **fades + scales in**, **invoice lines draw themselves**, the **S monogram self-draws** (`pathLength`), the **arrow draws, rises and glows**. ~1.2s sequence. Modes: `animate` (draw), `interactive` (hover scale 1.05 + arrow glow), `variant="tile"` (gradient squircle), `loop` (idle arrow pulse). |
| `BrandLogo` | `components/brand/BrandLogo.jsx` | Mark + wordmark lockup with a delayed wordmark reveal. Optional tagline. |
| `SplashScreen` | `components/brand/SplashScreen.jsx` | Full-screen startup experience: ambient gradient field, drawn logo, wordmark/tagline reveal, indeterminate progress shimmer, then fades out. |

**Where it appears**
- **Startup splash** — plays once per browser session (`App.jsx`, gated via `sessionStorage`).
- **Navbar** — `BrandLogo` (expanded) / `BrandMark` (collapsed), both **interactive**: hover scales 1.05 and the arrow **glows**; links to the dashboard.
- **Login / Register / Forgot / Reset** — `BrandMark` (tile) with an animated entrance + **floating** idle loop in `AuthCard`.
- **Favicon / app icon** — existing `/brand/*.svg` already share the exact geometry & gradient, so the identity is consistent end-to-end.

---

## 3. Reusable motion foundation

`lib/animations.js` — one shared vocabulary so every surface feels coherent:
`EASE`/`EASE_OUT`/`EASE_IN_OUT`/`SPRING`, plus variants `fadeIn`, `fadeInUp`,
`scaleIn`, `staggerContainer`, `listItem`, `pageTransition`, `modalPop`,
**`shake`**, **`floaty`**, `successPop`.

New reusable components:
- `components/ui/AnimatedCounter.jsx` — counts **0 → value** on view (currency or integer aware, reduced-motion safe).
- `components/ui/FormError.jsx` — error banner that **fades in and shakes**, re-shaking whenever the message changes.

---

## 4. Project-wide animations

| Area | Upgrade |
|---|---|
| **Dashboard** | KPI cards stagger in; values **count up from 0** (revenue & outstanding as currency, counts as integers); mini-stats animate; Recharts area/bars animate on display |
| **Sidebar** | Spring expand/collapse (existing), animated active-item pill (`layoutId`), icon hover scale |
| **Tables** | Rows **fade/slide in** with a capped stagger; re-runs on pagination & sort for smooth transitions |
| **Forms** | Inline **error shake** + fade via `FormError` across all 11 forms/modals; success surfaced through animated toasts |
| **Modals** | Scale + fade (spring) entrance/exit |
| **Notifications** | Premium spring toasts with circular status badges (from the prior polish pass) |
| **Page transitions** | `AnimatePresence mode="wait"` around `<Outlet/>` — content fades/slides **out then in** on every route change |

---

## 5. Files added / changed

**Added (6)**
- `lib/animations.js`
- `components/brand/BrandMark.jsx`
- `components/brand/BrandLogo.jsx`
- `components/brand/SplashScreen.jsx`
- `components/ui/AnimatedCounter.jsx`
- `components/ui/FormError.jsx`

**Wired (15)**
- `App.jsx` (splash), `components/Layout.jsx` (navbar logo + page transitions),
  `components/AuthCard.jsx` (floating logo), `pages/Dashboard.jsx` (counters),
  `components/ui/DataTable.jsx` (row fade-in), and the 11 forms/modals
  (`Login`, `Register`, `ForgotPassword`, `ResetPassword`, `InvoiceForm`,
  `QuoteForm`, `Settings`, `ClientFormModal`, `ProductFormModal`,
  `RecordPaymentModal`, `StockAdjustModal`) now use `FormError`.

---

## 6. "Avoid" checklist — honored
- **No excessive motion** — durations 0.2–1.2s; idle loops are slow & subtle.
- **No slow animations** — page/route changes ≤ 0.3s; counters ≤ 1.1s.
- **No distracting effects** — transform/opacity only; `prefers-reduced-motion`
  short-circuits draws, counters, shakes, and floats to static.

---

## 7. Verification
```
npm run build  → ✅ clean
npm run lint   → ✅ 0 problems
npm run dev    → ✅ HTTP 200, no errors
```
No `npm test` / frontend test runner exists; backend (Docker/Postgres
integration scripts) was not touched, so the gate is build + lint + boot.

## 8. Notes / optional follow-ups
- Splash shows once per session; clear `sessionStorage` to replay (or remove the
  guard in `App.jsx` to show on every load).
- Motion vendor chunk grew ~7 kB gz (more Framer features in use) — acceptable.
