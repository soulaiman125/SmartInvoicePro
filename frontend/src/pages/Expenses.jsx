import { useState } from 'react';
import { useExpenses, useExpenseCategories, useDeleteExpense } from '../hooks/useExpenses.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import ExpenseFormModal from '../components/ExpenseFormModal.jsx';
import Badge from '../components/Badge.jsx';
import DataTable, { Pagination } from '../components/ui/DataTable.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatMoney } from '../utils/money.js';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export default function Expenses() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError } = useExpenses({ search: debouncedSearch, category, from, to, page, pageSize: 10 });
  const { data: categories = [] } = useExpenseCategories();
  const deleteExpense = useDeleteExpense();
  const toast = useToast();

  const expenses = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const filtering = Boolean(debouncedSearch || category || from || to);

  const columns = [
    { key: 'date', header: 'Date', sortable: true, sortValue: (r) => r.date, exportValue: (r) => fmtDate(r.date), render: (r) => fmtDate(r.date) },
    { key: 'category', header: 'Category', sortable: true, exportValue: (r) => r.category, render: (r) => <Badge color="brand">{r.category}</Badge> },
    { key: 'vendor', header: 'Vendor', exportValue: (r) => r.vendor || '', render: (r) => r.vendor || '—' },
    { key: 'description', header: 'Description', exportValue: (r) => r.description || '', render: (r) => <span className="text-ink-500">{r.description || '—'}</span> },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, sortValue: (r) => Number(r.amount), exportValue: (r) => (Number(r.amount) / 100).toFixed(2), render: (r) => formatMoney(Number(r.amount) + Number(r.taxAmount), r.currency) },
  ];

  const bulkActions = [
    {
      label: 'Delete selected',
      variant: 'danger',
      onClick: async (ids, clear) => {
        if (!window.confirm(`Delete ${ids.length} expense(s)?`)) return;
        try {
          await Promise.all(ids.map((id) => deleteExpense.mutateAsync(id)));
          toast.success(`${ids.length} expense(s) deleted.`);
          clear();
        } catch {
          toast.error('Some expenses could not be deleted.');
        }
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Track spending to measure true profit.">
        <Button onClick={() => setModal({ expense: null })}>
          <Icon name="plus" className="h-4 w-4" /> New expense
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={expenses}
        loading={isLoading}
        error={isError}
        selectable
        bulkActions={bulkActions}
        exportName="expenses"
        onRowClick={(r) => setModal({ expense: r })}
        toolbar={
          <>
            <div className="relative w-full max-w-xs">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search category or vendor…"
                className="field-input pl-9"
              />
            </div>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="field-input w-auto cursor-pointer">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" aria-label="From" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="field-input w-auto cursor-pointer" />
            <input type="date" aria-label="To" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="field-input w-auto cursor-pointer" />
            {filtering && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategory(''); setFrom(''); setTo(''); setPage(1); }}>Clear</Button>
            )}
          </>
        }
        emptyState={
          <EmptyState
            bare
            icon="💸"
            title={filtering ? 'No matching expenses' : 'No expenses yet'}
            description={filtering ? 'Try adjusting your filters.' : 'Record your first expense to track profit.'}
            actionLabel={filtering ? undefined : 'New expense'}
            onAction={filtering ? undefined : () => setModal({ expense: null })}
          />
        }
      />

      <div className="mt-4 flex items-center justify-between gap-2 text-sm text-ink-400">
        <span>{total} expense{total === 1 ? '' : 's'}</span>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} className="mt-0" />
      </div>

      {modal && <ExpenseFormModal expense={modal.expense} onClose={() => setModal(null)} />}
    </div>
  );
}
