import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../hooks/useInvoices.js';
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
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useInvoices({ status, page, pageSize: 10 });

  const invoices = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

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
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="field-input w-auto cursor-pointer"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
          </select>
        }
        emptyState={
          <EmptyState
            bare
            icon="🧾"
            title={status ? 'No invoices with this status' : 'No invoices yet'}
            description={status ? 'Try a different status filter.' : 'Create your first invoice to get paid.'}
            actionLabel={status ? undefined : 'New invoice'}
            onAction={status ? undefined : () => navigate('/invoices/new')}
          />
        }
      />

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
