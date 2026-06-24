import { useState } from 'react';
import { useRecurringList, usePauseRecurring, useResumeRecurring, useDeleteRecurring, useRunRecurring } from '../hooks/useRecurring.js';
import RecurringFormModal from '../components/RecurringFormModal.jsx';
import Badge from '../components/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Pagination } from '../components/ui/DataTable.jsx';
import { formatMoney } from '../utils/money.js';
import { useToast } from '../context/ToastContext.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function cycleTotal(items = []) {
  let total = 0;
  for (const it of items) {
    const gross = Math.round(Number(it.quantity) * Number(it.unitPrice));
    const discount = Math.round((gross * (it.discountBasisPoints || 0)) / 10000);
    const sub = gross - discount;
    total += sub + Math.round((sub * (it.taxRateBasisPoints || 0)) / 10000);
  }
  return total;
}

export default function Recurring() {
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const { data, isLoading } = useRecurringList({ page, pageSize: 10 });
  const pause = usePauseRecurring();
  const resume = useResumeRecurring();
  const remove = useDeleteRecurring();
  const run = useRunRecurring();
  const toast = useToast();

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const onRun = async () => {
    try {
      const r = await run.mutateAsync();
      if (r.generated) toast.success(`Generated ${r.generated} invoice${r.generated === 1 ? '' : 's'}.`);
      else toast.info('No schedules are due right now.');
    } catch {
      toast.error('Could not run schedules.');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this recurring schedule? Existing invoices are kept.')) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Schedule deleted.');
    } catch {
      toast.error('Could not delete schedule.');
    }
  };

  return (
    <div>
      <PageHeader title="Recurring invoices" subtitle="Automate billing on a weekly, monthly, quarterly or yearly cadence.">
        <Button variant="secondary" onClick={onRun} loading={run.isPending}>
          <Icon name="clock" className="h-4 w-4" /> Generate due now
        </Button>
        <Button onClick={() => setModal({ recurring: null })}>
          <Icon name="plus" className="h-4 w-4" /> New schedule
        </Button>
      </PageHeader>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-ink-400">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            bare
            icon="🔁"
            title="No recurring invoices yet"
            description="Create a schedule to automatically generate invoices for your clients."
            actionLabel="New schedule"
            onAction={() => setModal({ recurring: null })}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-200 text-xs uppercase text-ink-500 dark:border-ink-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Frequency</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Next run</th>
                  <th className="px-4 py-3 font-semibold">Last run</th>
                  <th className="px-4 py-3 text-right font-semibold">Cycles</th>
                  <th className="px-4 py-3 text-right font-semibold">Per cycle</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40">
                    <td className="px-4 py-3 font-medium">{r.client?.name || '—'}</td>
                    <td className="px-4 py-3">{cap(r.frequency)}</td>
                    <td className="px-4 py-3"><Badge color={r.status === 'active' ? 'green' : 'amber'} dot>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-ink-500">{fmtDate(r.nextRunAt)}</td>
                    <td className="px-4 py-3 text-ink-500">{fmtDate(r.lastRunAt)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.occurrences}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(cycleTotal(r.items), r.currency)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === 'active' ? (
                          <button type="button" onClick={() => pause.mutate(r.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10">Pause</button>
                        ) : (
                          <button type="button" onClick={() => resume.mutate(r.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">Resume</button>
                        )}
                        <button type="button" onClick={() => setModal({ recurring: r })} className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10">Edit</button>
                        <button type="button" onClick={() => onDelete(r.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between gap-2 text-sm text-ink-400">
        <span>{total} schedule{total === 1 ? '' : 's'}</span>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} className="mt-0" />
      </div>

      {modal && <RecurringFormModal recurring={modal.recurring} onClose={() => setModal(null)} />}
    </div>
  );
}
