import { motion } from 'framer-motion';
import Button from './Button.jsx';

/**
 * Friendly empty state: a layered illustration backdrop + the supplied glyph,
 * an explanation, and a call-to-action. `icon` accepts any emoji/string.
 */
export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  bare = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center justify-center px-6 py-16 text-center ${
        bare
          ? ''
          : 'rounded-2xl border border-dashed border-ink-300 bg-white/50 dark:border-ink-700 dark:bg-ink-900/40'
      }`}
    >
      <div className="relative mb-5 flex h-28 w-28 items-center justify-center">
        {/* Soft gradient halo */}
        <div className="absolute inset-0 rounded-full bg-brand-gradient opacity-10 blur-2xl" />
        {/* Concentric rings */}
        <svg viewBox="0 0 112 112" className="absolute inset-0 h-full w-full text-brand-400/30">
          <circle cx="56" cy="56" r="54" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 5" />
          <circle cx="56" cy="56" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
        </svg>
        {/* Floating accent dots */}
        <motion.span
          className="absolute right-2 top-3 h-2.5 w-2.5 rounded-full bg-accent-400/70"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="absolute bottom-4 left-1 h-2 w-2 rounded-full bg-brand-400/70"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        {/* Glyph tile */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-ink-200/70 bg-white text-3xl shadow-card dark:border-ink-700 dark:bg-ink-800">
          {icon}
        </div>
      </div>
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
