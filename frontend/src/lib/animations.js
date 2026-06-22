/**
 * Shared motion vocabulary for SmartInvoice Pro.
 *
 * One source of truth for easing curves and Framer Motion variants so every
 * surface (pages, cards, tables, modals, the logo) feels like the same product.
 * Animations are intentionally short and subtle — Stripe/Linear/Framer grade,
 * never distracting. GPU-friendly properties only (transform + opacity).
 */

// Easings ------------------------------------------------------------------
export const EASE = [0.22, 1, 0.36, 1]; // easeOutExpo — confident settle
export const EASE_OUT = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT = [0.65, 0, 0.35, 1];
export const SPRING = { type: 'spring', stiffness: 400, damping: 32 };
export const SPRING_SOFT = { type: 'spring', stiffness: 260, damping: 26 };

// Primitives ---------------------------------------------------------------
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: EASE } },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: EASE } },
};

// Stagger container — children reveal in a smooth cascade.
export const staggerContainer = (stagger = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

// Table row / list item — tiny lift, capped so long lists stay calm.
export const listItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
};

// Route transition — used to wrap <Outlet/> content per pathname.
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: EASE_IN_OUT } },
};

// Modal pop — scale + fade.
export const modalPop = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: SPRING },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
};

// Error shake — horizontal nudge for failed validation.
export const shake = {
  initial: { x: 0 },
  animate: {
    x: [0, -8, 8, -6, 6, -3, 0],
    transition: { duration: 0.45, ease: EASE_IN_OUT },
  },
};

// Floating idle loop — for hero logos on auth/splash. Subtle, slow.
export const floaty = {
  animate: {
    y: [0, -7, 0],
    transition: { duration: 4.5, ease: EASE_IN_OUT, repeat: Infinity },
  },
};

// Success check pop.
export const successPop = {
  hidden: { scale: 0, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { ...SPRING_SOFT, delay: 0.05 } },
};
