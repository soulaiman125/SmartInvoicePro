# Landing Page Audit — SmartInvoice Pro

A world-class, premium SaaS landing page benchmarked against Stripe, Linear,
Framer, Vercel, Notion and Arc. Built on the existing design system so it feels
like one continuous product from marketing → app.

Route: **`/`** ([frontend/src/marketing/pages/Landing.jsx](frontend/src/marketing/pages/Landing.jsx))

---

## Design language

| Goal | Implementation |
| --- | --- |
| Luxury / premium SaaS | Large display typography (up to `text-6xl`, tightened tracking), generous whitespace, restrained palette |
| Beautiful gradients | `brand → accent` gradient text & buttons, gradient mesh background |
| Glassmorphism | `.glass` utility (translucent + `backdrop-blur-xl` + hairline border) on floating cards & testimonials |
| Depth | Layered aurora blobs, soft `shadow-glow` / `shadow-popover`, 3D tilt on the mockup |
| Dark + light mode | Every surface themed; the hero mockup swaps to the matching screenshot |

## Real screenshots (no placeholders)

Captured from the **live application** (logged in as the demo user, against the
seeded database) with Playwright + headless Chromium, in light **and** dark mode:

- `public/screenshots/dashboard-{light,dark}.png`
- `public/screenshots/invoices-{light,dark}.png`
- `public/screenshots/reports-{light,dark}.png`
- `public/screenshots/clients-light.png`

The hero and showcase render the screenshot that matches the active theme inside
a browser-chrome frame. Regenerate anytime with
[`frontend/scripts/capture-screenshots.mjs`](frontend/scripts/capture-screenshots.mjs).

## Animations (Framer Motion)

| Section | Effects |
| --- | --- |
| **Hero** | Animated badge/logo entrance · staggered line-by-line text reveal · CTA hover (scale + glow + arrow nudge) · floating dashboard mockup with entrance + sheen |
| **Background** | Gradient-mesh aurora blobs that drift on a loop and **parallax on scroll**, finished with a fine **noise grain** ([Aurora.jsx](frontend/src/marketing/components/Aurora.jsx)) |
| **Dashboard mockup** | **Mouse-parallax 3D tilt** (`useMotionValue` → `useSpring` → `rotateX/Y`), floating glass accent cards drifting at different depths ([FloatingMockup.jsx](frontend/src/marketing/components/FloatingMockup.jsx)) |
| **Stats** | **Animated counters** that count up on scroll-into-view (`AnimatedCounter`) |
| **Features** | Scroll-triggered staggered reveal · hover lift (`whileHover y:-6` spring) · icon rotate/scale + glow on hover |
| **Showcase** | Two interactive mockups (dashboard + reports) with mouse parallax and floating cards |
| **Pricing** | **Animated monthly/annual switcher** (shared-layout pill) · price roll transition · card hover lift |
| **FAQ** | Smooth height/opacity accordion |
| **Final CTA** | Pulsing glow orb, grid + noise texture |
| **Footer** | Elegant staggered reveal on scroll |

## Performance & 60 FPS

- Animations use **transform + opacity only** (GPU-composited); `will-change: transform` on parallax layers.
- `useReducedMotion()` is honored in Aurora, FloatingMockup, Reveal and AnimatedCounter — motion-sensitive users get a static, fast page.
- Marketing pages are **code-split / lazy-loaded**; the Landing chunk is **16.6 kB (4.95 kB gzipped)**.
- Screenshots: hero image `eager`, all others `lazy`.
- Noise texture is an **inline SVG data-URI** — zero extra network requests.

## Background effects checklist

- ✅ Gradient mesh background · ✅ Floating blurred shapes · ✅ Glow effects · ✅ Noise texture · ✅ Premium depth
- ✅ Avoided cheap particles / excessive motion / distracting effects

## Hero content (as specified)

- Headline: **“Modern Invoicing & Business Management for Growing Companies”**
- Subheadline: **“Manage invoices, products, inventory, clients and payments from one powerful platform.”**
- Buttons: **Start Free Trial** (→ `/register`) · **Watch Demo** (smooth-scrolls to the live showcase)
- Realistic, animated dashboard preview using the **real** product screenshot.

## Seamless marketing ↔ app transition

- `/` = landing; the app lives at `/dashboard`. Login / Get Started / nav route directly into the app.
- Identical design tokens (brand/ink palette, shadows, motion vocabulary) — no visual seam.

## Quality gate

| Check | Result |
| --- | --- |
| ESLint (`src`) | **0 errors** |
| Production build (`npm run build`) | **success** |
| Visual QA (light + dark, captured) | Hero, features, mockups verified |
| Dashboard application | **unchanged** (routing glue only) |

## Cleanup

Playwright was used only to capture screenshots and has been **uninstalled** to
keep `node_modules` lean; the screenshots persist in `public/screenshots/` and
the capture script remains for regeneration.

## Verdict

The page opens with a confident gradient hero, a live tilting product mockup
with floating metrics, animated proof-point counters, progressively revealing
feature cards, real in-app screenshots, an animated pricing switcher and a
glowing final CTA. It reads as **"a startup funded by investors."**
