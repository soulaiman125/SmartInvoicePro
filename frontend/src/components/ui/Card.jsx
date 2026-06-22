import { motion } from 'framer-motion';

/**
 * Surface primitive. `hover` adds a subtle lift; `interactive` wraps it in a
 * Framer motion element so it animates on hover/tap (use for clickable cards).
 */
export default function Card({
  className = '',
  hover = false,
  interactive = false,
  children,
  ...props
}) {
  const base =
    'rounded-2xl border border-ink-200/80 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900';
  const hoverCls = hover
    ? 'transition-shadow duration-200 hover:shadow-card-hover'
    : '';

  if (interactive) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className={`${base} cursor-pointer transition-shadow duration-200 hover:shadow-card-hover ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${base} ${hoverCls} ${className}`} {...props}>
      {children}
    </div>
  );
}
