import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useCategories, useDeleteProduct } from '../hooks/useProducts.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import ProductFormModal from '../components/ProductFormModal.jsx';
import ProductThumb from '../components/ProductThumb.jsx';
import Badge from '../components/Badge.jsx';
import DataTable, { Pagination } from '../components/ui/DataTable.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatMoney } from '../utils/money.js';

export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [modal, setModal] = useState(null);

  const { data, isLoading, isError } = useProducts({ search: debouncedSearch, category, page, pageSize: 10 });
  const { data: categories = [] } = useCategories();
  const deleteProduct = useDeleteProduct();
  const toast = useToast();

  const products = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const filtering = Boolean(debouncedSearch || category);

  const columns = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      sortValue: (r) => r.name,
      exportValue: (r) => r.name,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-lg border dark:border-gray-700">
            <ProductThumb src={p.imageUrl} name={p.name} size="md" rounded="rounded-none" />
          </div>
          <div>
            <span className="block font-medium text-gray-800 dark:text-gray-100">{p.name}</span>
            <span className="block text-xs text-gray-400">{p.sku || 'No SKU'}</span>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, exportValue: (r) => r.category || '', render: (p) => (p.category ? <Badge color="blue">{p.category}</Badge> : '—') },
    { key: 'unitPrice', header: 'Price', align: 'right', sortable: true, sortValue: (r) => Number(r.unitPrice), exportValue: (r) => (Number(r.unitPrice) / 100).toFixed(2), render: (p) => formatMoney(p.unitPrice, p.currency) },
    { key: 'isActive', header: 'Status', sortable: true, exportValue: (r) => (r.isActive ? 'Active' : 'Inactive'), render: (p) => <Badge color={p.isActive ? 'green' : 'amber'}>{p.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  const bulkActions = [
    {
      label: 'Delete selected',
      variant: 'danger',
      onClick: async (ids, clear) => {
        if (!window.confirm(`Delete ${ids.length} product(s)?`)) return;
        try {
          await Promise.all(ids.map((id) => deleteProduct.mutateAsync(id)));
          toast.success(`${ids.length} product(s) deleted.`);
          clear();
        } catch {
          toast.error('Some products could not be deleted.');
        }
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Products & Services" subtitle="Your catalog of billable items.">
        <Button onClick={() => setModal({ product: null })}>
          <Icon name="plus" className="h-4 w-4" /> New product
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={products}
        loading={isLoading}
        error={isError}
        selectable
        bulkActions={bulkActions}
        exportName="products"
        onRowClick={(p) => navigate(`/products/${p.id}`)}
        toolbar={
          <>
            <div className="relative w-full max-w-xs">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or SKU…"
                className="field-input pl-9"
              />
            </div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="field-input w-auto cursor-pointer"
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        }
        emptyState={
          <EmptyState
            bare
            icon="📦"
            title={filtering ? 'No matching products' : 'No products yet'}
            description={filtering ? 'Try adjusting your search or category filter.' : 'Add your first product or service to your catalog.'}
            actionLabel={filtering ? undefined : 'New product'}
            onAction={filtering ? undefined : () => setModal({ product: null })}
          />
        }
      />

      <div className="mt-4 flex items-center justify-between gap-2 text-sm text-ink-400">
        <span>{total} product{total === 1 ? '' : 's'}</span>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} className="mt-0" />
      </div>

      {modal && <ProductFormModal product={modal.product} onClose={() => setModal(null)} />}
    </div>
  );
}
