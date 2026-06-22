import { useState } from 'react';
import FormError from "./ui/FormError.jsx";
import Modal from './Modal.jsx';
import Button from './ui/Button.jsx';
import { Field, Input, Select } from './ui/Field.jsx';
import { useAdjustStock } from '../hooks/useInventory.js';
import { useToast } from '../context/ToastContext.jsx';

export default function StockAdjustModal({ products, onClose }) {
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [type, setType] = useState('in');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const adjust = useAdjustStock();
  const toast = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await adjust.mutateAsync({
        productId,
        payload: { type, quantity: Number(quantity), ...(reason ? { reason } : {}) },
      });
      toast.success('Stock updated.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not adjust stock.');
    }
  };

  return (
    <Modal title="Adjust stock" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        {products.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-ink-400">
            No inventory-tracked products. Enable “Track inventory” on a product first.
          </p>
        ) : (
          <>
            <Field label="Product">
              <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock: {p.stockQuantity})
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="in">Add stock</option>
                  <option value="out">Remove stock</option>
                  <option value="adjustment">Adjustment</option>
                </Select>
              </Field>
              <Field label="Quantity">
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </Field>
            </div>
            <Field label="Reason">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={adjust.isPending}>
                {adjust.isPending ? 'Saving…' : 'Apply'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
