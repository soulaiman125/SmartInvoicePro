import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '../services/auth.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './ui/Icon.jsx';

// Sidebar organization switcher: lists the user's organizations, switches the
// active tenant (re-issues a scoped token + reloads), and creates new ones.
export default function OrgSwitcher() {
  const { user, switchOrg, createOrg } = useAuth();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const { data: orgs = [] } = useQuery({ queryKey: ['organizations'], queryFn: getOrganizations });
  const current = orgs.find((o) => o.organizationId === user?.organizationId);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setCreating(false); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const onSwitch = async (id) => {
    if (id === user?.organizationId) { setOpen(false); return; }
    setBusy(true);
    try { await switchOrg(id); } catch { setBusy(false); }
  };
  const onCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try { await createOrg({ name: name.trim() }); } catch { setBusy(false); }
  };

  return (
    <div className="relative mb-3" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-ink-200/80 bg-white px-2.5 py-2 text-left transition-colors hover:bg-ink-50 dark:border-ink-700/80 dark:bg-ink-900 dark:hover:bg-ink-800"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-gradient text-xs font-bold text-white">
          {(current?.name || '?')[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{current?.name || 'Organization'}</span>
          <span className="block text-[11px] capitalize text-ink-400">{current?.role || ''}</span>
        </span>
        <Icon name="chevron" className="h-4 w-4 -rotate-90 text-ink-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-popover dark:border-ink-700 dark:bg-ink-900">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">Organizations</p>
          <ul className="max-h-56 overflow-y-auto scrollbar-thin">
            {orgs.map((o) => (
              <li key={o.organizationId}>
                <button
                  type="button"
                  onClick={() => onSwitch(o.organizationId)}
                  disabled={busy}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-ink-50 disabled:opacity-60 dark:hover:bg-ink-800"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand-gradient text-[10px] font-bold text-white">
                    {o.name?.[0]?.toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{o.name}</span>
                  {o.organizationId === user?.organizationId && <Icon name="check" className="h-4 w-4 text-brand-600" strokeWidth={2.5} />}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink-100 dark:border-ink-800">
            {creating ? (
              <form onSubmit={onCreate} className="p-2">
                <input
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="New organization name"
                  className="field-input"
                />
                <div className="mt-2 flex gap-2">
                  <button type="submit" disabled={busy} className="flex-1 rounded-lg bg-brand-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-60">Create</button>
                  <button type="button" onClick={() => setCreating(false)} className="rounded-lg px-2 py-1.5 text-xs text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">Cancel</button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-brand-600 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800"
              >
                <Icon name="plus" className="h-4 w-4" /> New organization
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
