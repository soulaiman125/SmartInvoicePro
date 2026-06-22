import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useProduct, useDeleteProduct } from '../hooks/useProducts.js';
import ProductFormModal from '../components/ProductFormModal.jsx';
import ProductThumb from '../components/ProductThumb.jsx';
import Badge from '../components/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { formatMoney } from '../utils/money.js';

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 text-sm text-ink-800 dark:text-ink-200">{children || <span className="text-ink-400">—</span>}</dd>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProduct(id);
  const deleteProduct = useDeleteProduct();
  const [editing, setEditing] = useState(false);

  const onDelete = async () => {
    if (!window.confirm('Delete this product?')) return;
    await deleteProduct.mutateAsync(id);
    navigate('/products', { replace: true });
  };

  if (isLoading) return <div className="text-ink-400">Loading product…</div>;
  if (isError || !product) {
    return (
      <div>
        <p className="text-red-500">Product not found.</p>
        <Link to="/products" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          ← Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <Icon name="chevron" className="h-4 w-4" /> Back to products
      </Link>

      <div className="mt-4 rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-800">
            <ProductThumb src={product.imageUrl} name={product.name} size="lg" rounded="rounded-none" />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">{product.name}</h2>
                <div className="mt-2 flex items-center gap-2">
                  {product.category && <Badge color="blue">{product.category}</Badge>}
                  <Badge color={product.isActive ? 'green' : 'amber'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight text-ink-900 tabular-nums dark:text-white">
              {formatMoney(product.unitPrice, product.currency)}
              <span className="ml-1 text-sm font-normal text-ink-400">/ {product.unit}</span>
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="SKU">{product.sku}</Field>
          <Field label="Currency">{product.currency}</Field>
          {product.trackInventory && <Field label="In stock">{product.stockQuantity}</Field>}
          <div className="sm:col-span-2">
            <Field label="Description">{product.description}</Field>
          </div>
        </dl>
      </div>

      {editing && <ProductFormModal product={product} onClose={() => setEditing(false)} />}
    </div>
  );
}
