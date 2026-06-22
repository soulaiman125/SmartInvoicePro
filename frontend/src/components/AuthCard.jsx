import { motion } from 'framer-motion';
import BrandMark from './brand/BrandMark.jsx';
import { floaty } from '../lib/animations.js';

// Shared shell for the authentication pages — premium split-free centered card
// on an ambient gradient backdrop with dark-mode support.
export default function AuthCard({ title, subtitle, children, footer, credit }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-50 px-4 dark:bg-ink-950">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-light bg-[size:32px_32px] opacity-[0.04] dark:opacity-[0.06]" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex w-full max-w-sm flex-col"
      ><div className="rounded-2xl border border-ink-200/80 bg-white/90 p-8 shadow-popover backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/80">
        <div className="flex flex-col items-center">
          <motion.div variants={floaty} animate="animate">
            <BrandMark size={56} animate variant="tile" uid="auth" />
          </motion.div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-ink-900 dark:text-white">
            SmartInvoice<span className="text-gradient"> Pro</span>
          </h1>
        </div>
        {title && (
          <h2 className="mt-6 text-center text-lg font-semibold text-ink-800 dark:text-ink-100">
            {title}
          </h2>
        )}
        {subtitle && <p className="mt-1 text-center text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && (
          <div className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">{footer}</div>
        )}
        </div>
        {credit && (
          <p className="mt-5 text-center text-xs font-medium tracking-wide text-ink-400/80 dark:text-ink-500/80">
            {credit}
          </p>
        )}
      </motion.div>
    </div>
  );
}
