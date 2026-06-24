import { useState } from 'react';
import { useAuditLogs } from '../hooks/useAudit.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Pagination } from '../components/ui/DataTable.jsx';

const VERB_STYLE = {
  create: { icon: 'plus', tone: 'bg-emerald-500' },
  update: { icon: 'check', tone: 'bg-brand-500' },
  delete: { icon: 'close', tone: 'bg-red-500' },
  issue: { icon: 'check-circle', tone: 'bg-violet-500' },
  pause: { icon: 'clock', tone: 'bg-amber-500' },
  resume: { icon: 'clock', tone: 'bg-emerald-500' },
  email: { icon: 'mail', tone: 'bg-sky-500' },
  reminder: { icon: 'mail', tone: 'bg-amber-500' },
  retry: { icon: 'mail', tone: 'bg-sky-500' },
  cancel: { icon: 'close', tone: 'bg-red-500' },
  run: { icon: 'clock', tone: 'bg-brand-500' },
};

function styleFor(action = '') {
  const verb = action.split('.')[1] || '';
  return VERB_STYLE[verb] || { icon: 'spark', tone: 'bg-ink-400' };
}

const ENTITY_TYPES = ['', 'invoice', 'quote', 'client', 'product', 'payment', 'expense', 'recurring-invoice', 'setting', 'inventory'];

export default function AuditLog() {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search, 300);
  const { data, isLoading } = useAuditLogs({ action: debounced, entityType, page, pageSize: 25 });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Audit log" subtitle="A complete timeline of actions across your organization." />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search actions…"
            className="field-input pl-9"
          />
        </div>
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} className="field-input w-auto cursor-pointer">
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t ? t.replace('-', ' ') : 'All types'}</option>)}
        </select>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState bare icon="🗂️" title="No activity yet" description="Actions you take across the app will appear here." />
        ) : (
          <ul className="relative space-y-5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-ink-200 dark:before:bg-ink-800">
            {rows.map((r) => {
              const s = styleFor(r.action);
              return (
                <li key={r.id} className="relative flex gap-3.5">
                  <span className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ring-4 ring-white dark:ring-ink-900 ${s.tone}`}>
                    <Icon name={s.icon} className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-ink-800 dark:text-ink-100">{r.action.replace('.', ' ')}</span>
                      {r.entityId && <span className="ml-1.5 text-xs text-ink-400">#{r.entityId.slice(0, 8)}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {r.actor?.fullName || r.actor?.email || 'System'}
                      {r.metadata?.method && <span className="ml-1.5 rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-500 dark:bg-ink-800">{r.metadata.method} {r.metadata.status}</span>}
                      <span className="ml-1.5">{new Date(r.createdAt).toLocaleString()}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between gap-2 text-sm text-ink-400">
        <span>{total} event{total === 1 ? '' : 's'}</span>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} className="mt-0" />
      </div>
    </div>
  );
}
