import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext.jsx';
import Icon from './ui/Icon.jsx';

// Global ⌘K / Ctrl+K command palette for navigation + quick actions.
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  const commands = useMemo(
    () => [
      { id: 'dash', label: 'Go to Dashboard', icon: 'dashboard', hint: 'G D', run: () => navigate('/dashboard') },
      { id: 'reports', label: 'Go to Reports', icon: 'bar-chart', run: () => navigate('/reports') },
      { id: 'expenses', label: 'Go to Expenses', icon: 'wallet', run: () => navigate('/expenses') },
      { id: 'clients', label: 'Go to Clients', icon: 'clients', run: () => navigate('/clients') },
      { id: 'products', label: 'Go to Products', icon: 'products', run: () => navigate('/products') },
      { id: 'inventory', label: 'Go to Inventory', icon: 'inventory', run: () => navigate('/inventory') },
      { id: 'invoices', label: 'Go to Invoices', icon: 'invoices', run: () => navigate('/invoices') },
      { id: 'quotes', label: 'Go to Quotes', icon: 'quotes', run: () => navigate('/quotes') },
      { id: 'settings', label: 'Go to Settings', icon: 'settings', run: () => navigate('/settings') },
      { id: 'new-invoice', label: 'Create new invoice', icon: 'plus', hint: 'Action', run: () => navigate('/invoices/new') },
      { id: 'new-quote', label: 'Create new quote', icon: 'plus', hint: 'Action', run: () => navigate('/quotes/new') },
      { id: 'theme', label: 'Toggle dark / light mode', icon: 'moon', run: toggleTheme },
    ],
    [navigate, toggleTheme],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
  }, [query, commands]);

  // Global open shortcut.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const exec = (cmd) => {
    setOpen(false);
    cmd?.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      exec(results[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-ink-950/50 p-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-ink-200/80 bg-white/95 shadow-popover backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/95"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-ink-200 px-4 dark:border-ink-800">
              <Icon name="search" className="h-4 w-4 shrink-0 text-ink-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Type a command or search…"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-ink-400"
              />
              <kbd className="hidden rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-400 dark:border-ink-700 dark:bg-ink-800 sm:inline">
                ESC
              </kbd>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              {results.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-ink-400">No commands found.</li>
              ) : (
                results.map((cmd, i) => (
                  <li key={cmd.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => exec(cmd)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        i === active
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                          : 'text-ink-700 dark:text-ink-300'
                      }`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${i === active ? 'bg-white text-brand-600 shadow-xs dark:bg-ink-800 dark:text-brand-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'}`}>
                        <Icon name={cmd.icon || 'command'} className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{cmd.label}</span>
                      {cmd.hint && (
                        <span className="rounded border border-ink-200 px-1.5 py-0.5 text-[10px] uppercase text-ink-400 dark:border-ink-700">
                          {cmd.hint}
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
