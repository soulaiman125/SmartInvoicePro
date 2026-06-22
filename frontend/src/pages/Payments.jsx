import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePayments } from '../hooks/usePayments.js';
import Badge from '../components/Badge.jsx';
import DataTable, { Pagination } from '../components/ui/DataTable.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { formatMoney } from '../utils/money.js';

const STATUSES = ['', 'succeeded', 'pending', 'failed', 'refunded'];
const STATUS_COLOR = { succeeded: 'green', pending: 'amber', failed: 'red', refunded: 'gray' };

export default function Payments() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePayments({ status, page, pageSize: 10 });

  const payments = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const columns = [
    { key: 'paidAt', header: 'Date', sortable: true, sortValue: (r) => r.paidAt || r.createdAt, exportValue: (r) => new Date(r.paidAt || r.createdAt).toLocaleDateString(), render: (r) => new Date(r.paidAt || r.createdAt).toLocaleDateString() },
    { key: 'invoice', header: 'Invoice', exportValue: (r) => r.invoice?.number || '', render: (r) => r.invoice?.number || '—' },
    { key: 'method', header: 'Method', sortable: true, exportValue: (r) => r.method, render: (r) => <span className="capitalize">{r.method.replace('_', ' ')}</span> },
    { key: 'status', header: 'Status', sortable: true, exportValue: (r) => r.status, render: (r) => <Badge color={STATUS_COLOR[r.status] || 'gray'}>{r.status}</Badge> },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, sortValue: (r) => Number(r.amount), exportValue: (r) => (Number(r.amount) / 100).toFixed(2), render: (r) => formatMoney(r.amount, r.currency) },
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle="Every payment recorded across your invoices." />

      <DataTable
        columns={columns}
        rows={payments}
        loading={isLoading}
        error={isError}
        exportName="payments"
        onRowClick={(r) => r.invoiceId && navigate(`/invoices/${r.invoiceId}`)}
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
            icon="💳"
            title="No payments yet"
            description="Payments you record on invoices will appear here."
          />
        }
      />

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
