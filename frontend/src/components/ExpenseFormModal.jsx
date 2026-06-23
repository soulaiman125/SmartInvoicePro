import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from './ui/Button.jsx';
import { useCreateExpense, useUpdateExpense, useExpenseCategories } from '../hooks/useExpenses.js';
import { useToast } from '../context/ToastContext.jsx';
import { toMinorUnits, toMajorUnits } from '../utils/money.js';

const COMMON_CATEGORIES = ['Software', 'Office', 'Travel', 'Marketing', 'Payroll', 'Utilities', 'Equipment', 'Professional fees', 'Other'];

const today = () => new Date().toISOString().slice(0, 10);
const input = 'field-input mt-1';

export default function ExpenseFormModal({ expense, onClose }) {
  const isEdit = Boolean(expense);
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const { data: categories = [] } = useExpenseCategories();
  const toast = useToast();

  const [form, setForm] = useState({
    category: expense?.category || '',
    vendor: expense?.vendor || '',
    amount: expense ? toMajorUnits(expense.amount) : '',
    taxAmount: expense?.taxAmount ? toMajorUnits(expense.taxAmount) : '',
    currency: expense?.currency || 'USD',
    date: expense?.date ? expense.date.slice(0, 10) : today(),
    description: expense?.description || '',
  });
  const [error, setError] = useState(null);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const suggestions = [...new Set([...categories, ...COMMON_CATEGORIES])];

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      category: form.category.trim(),
      amount: toMinorUnits(form.amount || '0'),
      taxAmount: toMinorUnits(form.taxAmount || '0'),
      currency: form.currency.toUpperCase(),
      date: form.date,
      ...(form.vendor ? { vendor: form.vendor } : {}),
      ...(form.description ? { description: form.description } : {}),
    };
    try {
      if (isEdit) await update.mutateAsync({ id: expense.id, payload });
      else await create.mutateAsync(payload);
      toast.success(isEdit ? 'Expense updated.' : 'Expense added.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.issues?.[0]?.message || err.response?.data?.message || 'Could not save expense.');
    }
  };

  return (
    <Modal title={isEdit ? 'Edit expense' : 'New expense'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 text-sm font-medium">Category
            <input list="expense-categories" value={form.category} onChange={set('category')} className={input} required placeholder="e.g. Software" />
            <datalist id="expense-categories">
              {suggestions.map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>
          <label className="text-sm font-medium">Amount
            <input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} className={input} required placeholder="0.00" />
          </label>
          <label className="text-sm font-medium">Tax
            <input type="number" min="0" step="0.01" value={form.taxAmount} onChange={set('taxAmount')} className={input} placeholder="0.00" />
          </label>
          <label className="text-sm font-medium">Date
            <input type="date" value={form.date} onChange={set('date')} className={input} required />
          </label>
          <label className="text-sm font-medium">Currency
            <input value={form.currency} onChange={set('currency')} maxLength={3} className={`${input} uppercase`} />
          </label>
          <label className="col-span-2 text-sm font-medium">Vendor
            <input value={form.vendor} onChange={set('vendor')} className={input} placeholder="Optional" />
          </label>
          <label className="col-span-2 text-sm font-medium">Description
            <input value={form.description} onChange={set('description')} className={input} placeholder="Optional" />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isEdit ? 'Save changes' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
