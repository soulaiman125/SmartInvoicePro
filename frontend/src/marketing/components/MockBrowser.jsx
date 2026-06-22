// A macOS-style window/browser chrome used to frame product "screenshots"
// (high-fidelity UI mockups built from the real design system).
export default function MockBrowser({ url = 'app.smartinvoice.pro', children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-popover ring-1 ring-black/5 dark:border-ink-800 dark:bg-ink-900 ${className}`}>
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/80 px-4 py-2.5 dark:border-ink-800 dark:bg-ink-950/60">
        <span className="h-3 w-3 rounded-full bg-red-400/90" />
        <span className="h-3 w-3 rounded-full bg-amber-400/90" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-ink-400 shadow-xs dark:bg-ink-900 dark:text-ink-500">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 11V7a5 5 0 0 1 10 0v4" /><rect x="5" y="11" width="14" height="10" rx="2" /></svg>
          {url}
        </div>
      </div>
      <div className="bg-ink-50/60 dark:bg-ink-950/40">{children}</div>
    </div>
  );
}
