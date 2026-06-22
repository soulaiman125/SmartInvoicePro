import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotations } from '../hooks/useQuotations.js';
import StatusBadge from '../components/StatusBadge.jsx';
import DataTable, { Pagination } from '../components/ui/DataTable.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import { formatMoney } from '../utils/money.js';

const STATUSES = ['', 'draft', 'sent', 'accepted', 'declined', 'expired'];

export default function Quotes() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuotations({ status, page, pageSize: 10 });

  const quotes = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const columns = [
    { key: 'number', header: 'Number', sortable: true, exportValue: (r) => r.number || 'Draft', render: (r) => <span className="font-medium text-brand-600">{r.number || 'Draft'}</span> },
    { key: 'client', header: 'Client', exportValue: (r) => r.client?.name || '', render: (r) => r.client?.name || '—' },
    { key: 'status', header: 'Status', sortable: true, exportValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'total', header: 'Total', align: 'right', sortable: true, sortValue: (r) => Number(r.total), exportValue: (r) => (Number(r.total) / 100).toFixed(2), render: (r) => formatMoney(r.total, r.currency) },
    { key: 'validUntil', header: 'Valid until', sortable: true, exportValue: (r) => (r.validUntil ? new Date(r.validUntil).toLocaleDateString() : ''), render: (r) => (r.validUntil ? new Date(r.validUntil).toLocaleDateString() : '—') },
  ];

  return (
    <div>
      <PageHeader title="Quotations" subtitle="Send estimates and convert them to invoices.">
        <Button onClick={() => navigate('/quotes/new')}>
          <Icon name="plus" className="h-4 w-4" /> New quote
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={quotes}
        loading={isLoading}
        error={isError}
        exportName="quotes"
        onRowClick={(r) => navigate(`/quotes/${r.id}`)}
        toolbar={
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="field-input w-auto cursor-pointer"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
        }
        emptyState={
          <EmptyState
            bare
            icon="📝"
            title={status ? 'No quotes with this status' : 'No quotations yet'}
            description={status ? 'Try a different status filter.' : 'Send your first estimate to a client.'}
            actionLabel={status ? undefined : 'New quote'}
            onAction={status ? undefined : () => navigate('/quotes/new')}
          />
        }
      />

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
