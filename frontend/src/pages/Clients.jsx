import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients, useDeleteClient } from '../hooks/useClients.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import ClientFormModal from '../components/ClientFormModal.jsx';
import Avatar from '../components/Avatar.jsx';
import Badge from '../components/Badge.jsx';
import DataTable, { Pagination } from '../components/ui/DataTable.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [modal, setModal] = useState(null);

  const { data, isLoading, isError } = useClients({ search: debouncedSearch, page, pageSize: 10 });
  const deleteClient = useDeleteClient();
  const toast = useToast();

  const clients = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const columns = [
    {
      key: 'name',
      header: 'Client',
      sortable: true,
      sortValue: (r) => r.name,
      exportValue: (r) => r.name,
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size="sm" />
          <span>
            <span className="block font-medium text-gray-800 dark:text-gray-100">{c.name}</span>
            <span className="block text-xs text-gray-400">{c.email || 'No email'}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      exportValue: (r) => r.type,
      render: (c) => <Badge color={c.type === 'company' ? 'blue' : 'gray'}>{c.type}</Badge>,
    },
    { key: 'email', header: 'Email', exportValue: (r) => r.email || '', render: (c) => c.email || '—' },
    { key: 'taxId', header: 'Tax ID', exportValue: (r) => r.taxId || '', render: (c) => c.taxId || '—' },
  ];

  const bulkActions = [
    {
      label: 'Delete selected',
      variant: 'danger',
      onClick: async (ids, clear) => {
        if (!window.confirm(`Delete ${ids.length} client(s)? Those with invoices are archived.`)) return;
        try {
          await Promise.all(ids.map((id) => deleteClient.mutateAsync(id)));
          toast.success(`${ids.length} client(s) removed.`);
          clear();
        } catch {
          toast.error('Some clients could not be deleted.');
        }
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Clients" subtitle="Manage the people and companies you invoice.">
        <Button onClick={() => setModal({ client: null })}>
          <Icon name="plus" className="h-4 w-4" /> New client
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={clients}
        loading={isLoading}
        error={isError}
        selectable
        bulkActions={bulkActions}
        exportName="clients"
        onRowClick={(c) => navigate(`/clients/${c.id}`)}
        toolbar={
          <div className="relative w-full max-w-xs">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email…"
              className="field-input pl-9"
            />
          </div>
        }
        emptyState={
          <EmptyState
            bare
            icon="🧾"
            title={debouncedSearch ? 'No matching clients' : 'No clients yet'}
            description={debouncedSearch ? 'Try a different name or email.' : 'Add your first client to start sending invoices.'}
            actionLabel={debouncedSearch ? undefined : 'New client'}
            onAction={debouncedSearch ? undefined : () => setModal({ client: null })}
          />
        }
      />

      <div className="mt-4 flex items-center justify-between gap-2 text-sm text-ink-400">
        <span>{total} client{total === 1 ? '' : 's'}</span>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} className="mt-0" />
      </div>

      {modal && <ClientFormModal client={modal.client} onClose={() => setModal(null)} />}
    </div>
  );
}
