import { useState, useMemo } from 'react';
import FormError from "../components/ui/FormError.jsx";
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useClients } from '../hooks/useClients.js';
import { useQuotation, useCreateQuotation, useUpdateQuotation } from '../hooks/useQuotations.js';
import { previewTotals, formatMoney, toMinorUnits, toMajorUnits } from '../utils/money.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Icon from '../components/ui/Icon.jsx';

const input = 'field-input';
const blankLine = { description: '', quantity: 1, unitPrice: '', taxPercent: 0 };

export default function QuoteForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: clientsPage } = useClients({ pageSize: 100 });
  const { data: existing } = useQuotation(id);
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();

  const [form, setForm] = useState({ clientId: '', currency: 'USD', issueDate: '', validUntil: '' });
  const [lines, setLines] = useState([{ ...blankLine }]);
  const [error, setError] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  if (isEdit && existing && !hydrated) {
    setForm({
      clientId: existing.clientId,
      currency: existing.currency,
      issueDate: existing.issueDate ? existing.issueDate.slice(0, 10) : '',
      validUntil: existing.validUntil ? existing.validUntil.slice(0, 10) : '',
    });
    setLines(existing.items.map((it) => ({
      description: it.description,
      quantity: Number(it.quantity),
      unitPrice: toMajorUnits(it.unitPrice),
      taxPercent: it.taxRateBasisPoints / 100,
    })));
    setHydrated(true);
  }

  const clients = clientsPage?.data ?? [];
  const totals = useMemo(() => previewTotals(lines), [lines]);
  const saving = createQuotation.isPending || updateQuotation.isPending;

  const updateField = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const updateLine = (i, f) => (e) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [f]: e.target.value } : l)));
  const addLine = () => setLines((ls) => [...ls, { ...blankLine }]);
  const removeLine = (i) => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      clientId: form.clientId,
      currency: form.currency.toUpperCase(),
      ...(form.issueDate ? { issueDate: form.issueDate } : {}),
      ...(form.validUntil ? { validUntil: form.validUntil } : {}),
      items: lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: toMinorUnits(l.unitPrice || '0'),
        taxRateBasisPoints: Math.round((Number(l.taxPercent) || 0) * 100),
      })),
    };
    try {
      const result = isEdit
        ? await updateQuotation.mutateAsync({ id, payload })
        : await createQuotation.mutateAsync(payload);
      navigate(`/quotes/${result.id}`);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.issues?.[0]?.message || data?.message || 'Could not save quotation.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/quotes" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <Icon name="chevron" className="h-4 w-4" /> Quotations
      </Link>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">{isEdit ? 'Edit quote' : 'New quote'}</h2>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <FormError message={error} />

        <Card className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          <label className="col-span-2 text-sm">
            <span className="field-label">Client</span>
            <select value={form.clientId} onChange={updateField('clientId')} className={`${input} cursor-pointer`} required>
              <option value="">Select a client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="field-label">Currency</span>
            <input value={form.currency} onChange={updateField('currency')} maxLength={3} className={`${input} uppercase`} />
          </label>
          <label className="text-sm">
            <span className="field-label">Valid until</span>
            <input type="date" value={form.validUntil} onChange={updateField('validUntil')} className={input} />
          </label>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Line items</h3>
            <Button type="button" variant="ghost" size="sm" onClick={addLine}>
              <Icon name="plus" className="h-4 w-4" /> Add line
            </Button>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input className={`${input} col-span-6`} placeholder="Description" value={l.description} onChange={updateLine(i, 'description')} required />
                <input className={`${input} col-span-2`} type="number" min="0" step="0.01" placeholder="Qty" value={l.quantity} onChange={updateLine(i, 'quantity')} />
                <input className={`${input} col-span-2`} type="number" min="0" step="0.01" placeholder="Price" value={l.unitPrice} onChange={updateLine(i, 'unitPrice')} />
                <input className={`${input} col-span-1`} type="number" min="0" placeholder="Tax%" value={l.taxPercent} onChange={updateLine(i, 'taxPercent')} />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="col-span-1 flex items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  aria-label="Remove line"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="ml-auto mt-5 w-60 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="tabular-nums">{formatMoney(totals.subtotal, form.currency)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Tax</span><span className="tabular-nums">{formatMoney(totals.taxTotal, form.currency)}</span></div>
            <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold dark:border-ink-700"><span>Total</span><span className="tabular-nums">{formatMoney(totals.total, form.currency)}</span></div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/quotes')}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save quote' : 'Create quote'}
          </Button>
        </div>
      </form>
    </div>
  );
}
