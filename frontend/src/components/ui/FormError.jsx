import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE_IN_OUT } from '../../lib/animations.js';

/**
 * Animated form error banner. Fades in and gives a brief horizontal shake; the
 * shake replays whenever the message text changes (keyed on `message`).
 */
export default function FormError({ message, className = '' }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false} mode="wait">
      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, y: -4 }}
          animate={{
            opacity: 1,
            y: 0,
            x: reduce ? 0 : [0, -8, 8, -6, 6, -3, 0],
          }}
          exit={{ opacity: 0, y: -4 }}
          transition={{
            x: { duration: 0.45, ease: EASE_IN_OUT },
            opacity: { duration: 0.2 },
            y: { duration: 0.2 },
          }}
          className={`rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 ${className}`}
          role="alert"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
