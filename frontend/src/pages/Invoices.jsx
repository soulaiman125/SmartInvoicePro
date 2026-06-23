import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../hooks/useInvoices.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import StatusBadge from '../components/StatusBadge.jsx';
import DataTable, { Pagination } from '../components/ui/DataTable.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import { formatMoney } from '../utils/money.js';

const STATUSES = ['', 'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'];

export default function Invoices() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, isLoading, isError } = useInvoices({ status, search: debouncedSearch, from, to, page, pageSize: 10 });

  const invoices = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const filtering = Boolean(status || debouncedSearch || from || to);

  const columns = [
    { key: 'number', header: 'Number', sortable: true, exportValue: (r) => r.number || 'Draft', render: (r) => <span className="font-medium text-brand-600">{r.number || 'Draft'}</span> },
    { key: 'client', header: 'Client', exportValue: (r) => r.client?.name || '', render: (r) => r.client?.name || '—' },
    { key: 'status', header: 'Status', sortable: true, exportValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total', header: 'Total', align: 'right', sortable: true, sortValue: (r) => Number(r.total), exportValue: (r) => (Number(r.total) / 100).toFixed(2), render: (r) => formatMoney(r.total, r.currency) },
    { key: 'balanceDue', header: 'Balance', align: 'right', sortable: true, sortValue: (r) => Number(r.balanceDue), exportValue: (r) => (Number(r.balanceDue) / 100).toFixed(2), render: (r) => formatMoney(r.balanceDue, r.currency) },
    { key: 'dueDate', header: 'Due', sortable: true, exportValue: (r) => (r.dueDate ? new Date(r.dueDate).toLocaleDateString() : ''), render: (r) => (r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—') },
  ];

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Bill your clients and track payments.">
        <Button onClick={() => navigate('/invoices/new')}>
          <Icon name="plus" className="h-4 w-4" /> New invoice
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={invoices}
        loading={isLoading}
        error={isError}
        exportName="invoices"
        onRowClick={(r) => navigate(`/invoices/${r.id}`)}
        toolbar={
          <>
            <div className="relative w-full max-w-xs">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search number or client…"
                className="field-input pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="field-input w-auto cursor-pointer"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
            </select>
            <input
              type="date"
              aria-label="Issued from"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="field-input w-auto cursor-pointer"
            />
            <input
              type="date"
              aria-label="Issued to"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="field-input w-auto cursor-pointer"
            />
            {filtering && (
              <Button variant="ghost" size="sm" onClick={() => { setStatus(''); setSearch(''); setFrom(''); setTo(''); setPage(1); }}>
                Clear
              </Button>
            )}
          </>
        }
        emptyState={
          <EmptyState
            bare
            icon="🧾"
            title={filtering ? 'No matching invoices' : 'No invoices yet'}
            description={filtering ? 'Try adjusting your search, status or date filters.' : 'Create your first invoice to get paid.'}
            actionLabel={filtering ? undefined : 'New invoice'}
            onAction={filtering ? undefined : () => navigate('/invoices/new')}
          />
        }
      />

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
