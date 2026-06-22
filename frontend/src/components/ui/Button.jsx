import { motion } from 'framer-motion';
import Spinner from './Spinner.jsx';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-glow-sm hover:bg-brand-500 active:bg-brand-700',
  secondary:
    'border border-ink-200 bg-white text-ink-700 shadow-xs hover:bg-ink-50 hover:border-ink-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800',
  ghost:
    'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
  danger:
    'border border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-ink-900 dark:hover:bg-red-950/40',
  success: 'bg-emerald-600 text-white shadow-glow-sm hover:bg-emerald-500',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
  icon: 'p-2 gap-0',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      data-no-color-transition
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-[background-color,box-shadow,border-color,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </motion.button>
  );
}
