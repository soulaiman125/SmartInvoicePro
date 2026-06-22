import { useState } from 'react';
import Modal from './Modal.jsx';
import ProductThumb from './ProductThumb.jsx';
import Button from './ui/Button.jsx';
import FormError from './ui/FormError.jsx';
import { Field, Input, Select, Textarea } from './ui/Field.jsx';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts.js';
import { toMinorUnits, toMajorUnits } from '../utils/money.js';

function initialForm(product) {
  return {
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? '',
    price: product ? toMajorUnits(product.unitPrice) : '',
    currency: product?.currency ?? 'USD',
    unit: product?.unit ?? 'unit',
    description: product?.description ?? '',
    imageUrl: product?.imageUrl ?? '',
    trackInventory: product?.trackInventory ?? false,
    lowStockThreshold: product?.lowStockThreshold ?? 0,
  };
}

export default function ProductFormModal({ product, onClose }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(() => initialForm(product));
  const [error, setError] = useState(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const saving = createProduct.isPending || updateProduct.isPending;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      currency: form.currency.toUpperCase(),
      unit: form.unit,
      unitPrice: toMinorUnits(form.price || '0'),
      ...(form.sku ? { sku: form.sku } : {}),
      ...(form.category ? { category: form.category } : {}),
      ...(form.description ? { description: form.description } : {}),
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      trackInventory: Boolean(form.trackInventory),
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
    };

    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id: product.id, payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.issues?.[0]?.message || data?.message || 'Could not save product.');
    }
  };

  return (
    <Modal title={isEdit ? 'Edit product' : 'New product'} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="max-h-[72vh] overflow-y-auto pr-1 scrollbar-thin">
        <FormError message={error} className="mb-4" />

        <div className="mb-4 flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
            <ProductThumb src={form.imageUrl} name={form.name} size="md" rounded="rounded-lg" />
          </div>
          <Field label="Image URL" className="flex-1">
            <Input value={form.imageUrl} onChange={update('imageUrl')} placeholder="https://…" />
          </Field>
        </div>

        <Field label="Name" required className="mb-4">
          <Input value={form.name} onChange={update('name')} required />
        </Field>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <Field label="SKU">
            <Input value={form.sku} onChange={update('sku')} />
          </Field>
          <Field label="Category">
            <Input value={form.category} onChange={update('category')} list="product-categories" />
          </Field>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-4">
          <Field label="Price" required>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required />
          </Field>
          <Field label="Currency">
            <Input value={form.currency} onChange={update('currency')} maxLength={3} className="uppercase" />
          </Field>
          <Field label="Unit">
            <Select value={form.unit} onChange={update('unit')}>
              <option value="unit">unit</option>
              <option value="hour">hour</option>
              <option value="day">day</option>
              <option value="item">item</option>
            </Select>
          </Field>
        </div>

        <Field label="Description" className="mb-4">
          <Textarea value={form.description} onChange={update('description')} rows={3} />
        </Field>

        <div className="mb-6 rounded-xl border border-ink-200 bg-ink-50/50 p-4 dark:border-ink-800 dark:bg-ink-850/40">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-700 dark:text-ink-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/40 dark:border-ink-600 dark:bg-ink-800"
              checked={form.trackInventory}
              onChange={(e) => setForm((f) => ({ ...f, trackInventory: e.target.checked }))}
            />
            Track inventory for this product
          </label>
          {form.trackInventory && (
            <Field label="Low-stock threshold" className="mt-3">
              <Input type="number" min="0" value={form.lowStockThreshold} onChange={update('lowStockThreshold')} />
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
