const styles = {
  gray: 'bg-ink-100 text-ink-600 ring-ink-200/70 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700',
  green:
    'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200/70 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
  amber:
    'bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  red: 'bg-red-50 text-red-700 ring-red-200/70 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  brand:
    'bg-brand-50 text-brand-700 ring-brand-200/70 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20',
};

export default function Badge({ color = 'gray', dot = false, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[color] || styles.gray}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
