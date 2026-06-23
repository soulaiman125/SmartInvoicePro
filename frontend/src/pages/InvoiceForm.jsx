import { useState, useMemo } from 'react';
import FormError from "../components/ui/FormError.jsx";
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useClients } from '../hooks/useClients.js';
import { useSettings } from '../hooks/useSettings.js';
import { useInvoice, useCreateInvoice, useUpdateInvoice } from '../hooks/useInvoices.js';
import { previewTotals, formatMoney, toMinorUnits, toMajorUnits } from '../utils/money.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Icon from '../components/ui/Icon.jsx';

const input = 'field-input';

const blankLine = { description: '', quantity: 1, unitPrice: '', taxPercent: 0, discountPercent: 0 };

export default function InvoiceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: clientsPage } = useClients({ pageSize: 100 });
  const { data: org } = useSettings();
  const { data: existing } = useInvoice(id);
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const [form, setForm] = useState({ clientId: '', currency: 'USD', issueDate: '', dueDate: '', notes: '' });
  const [lines, setLines] = useState([{ ...blankLine }]);
  const [error, setError] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Organization defaults (base currency + default tax) applied to new invoices.
  const defaultTaxPercent = org?.settings?.defaultTaxBps != null ? org.settings.defaultTaxBps / 100 : 0;

  // Hydrate the form once when editing an existing invoice.
  if (isEdit && existing && !hydrated) {
    setForm({
      clientId: existing.clientId,
      currency: existing.currency,
      issueDate: existing.issueDate ? existing.issueDate.slice(0, 10) : '',
      dueDate: existing.dueDate ? existing.dueDate.slice(0, 10) : '',
      notes: existing.notes || '',
    });
    setLines(
      existing.items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: toMajorUnits(it.unitPrice),
        taxPercent: it.taxRateBasisPoints / 100,
        discountPercent: it.discountBasisPoints / 100,
      })),
    );
    setHydrated(true);
  }

  // Apply org defaults once for a brand-new invoice (currency + default tax).
  if (!isEdit && org && !hydrated) {
    setForm((s) => ({ ...s, currency: org.baseCurrency || s.currency }));
    setLines((ls) => ls.map((l, i) => (i === 0 ? { ...l, taxPercent: defaultTaxPercent } : l)));
    setHydrated(true);
  }

  const clients = clientsPage?.data ?? [];
  const totals = useMemo(() => previewTotals(lines), [lines]);
  const saving = createInvoice.isPending || updateInvoice.isPending;
  const locked = isEdit && existing && existing.status !== 'draft';

  const updateField = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const updateLine = (i, f) => (e) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [f]: e.target.value } : l)));
  const addLine = () => setLines((ls) => [...ls, { ...blankLine, taxPercent: defaultTaxPercent }]);
  const removeLine = (i) => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      clientId: form.clientId,
      currency: form.currency.toUpperCase(),
      ...(form.issueDate ? { issueDate: form.issueDate } : {}),
      ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
      items: lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: toMinorUnits(l.unitPrice || '0'),
        taxRateBasisPoints: Math.round((Number(l.taxPercent) || 0) * 100),
        discountBasisPoints: Math.round((Number(l.discountPercent) || 0) * 100),
      })),
    };
    try {
      const result = isEdit
        ? await updateInvoice.mutateAsync({ id, payload })
        : await createInvoice.mutateAsync(payload);
      navigate(`/invoices/${result.id}`);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.issues?.[0]?.message || data?.message || 'Could not save invoice.');
    }
  };

  if (locked) {
    return (
      <div>
        <p className="text-amber-600">Issued invoices are immutable and cannot be edited.</p>
        <Link to={`/invoices/${id}`} className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          ← Back to invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/invoices" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <Icon name="chevron" className="h-4 w-4" /> Invoices
      </Link>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">{isEdit ? 'Edit invoice' : 'New invoice'}</h2>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <FormError message={error} />

        <Card className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          <label className="col-span-2 text-sm">
            <span className="field-label">Client</span>
            <select value={form.clientId} onChange={updateField('clientId')} className={`${input} cursor-pointer`} required>
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="field-label">Currency</span>
            <input value={form.currency} onChange={updateField('currency')} maxLength={3} className={`${input} uppercase`} />
          </label>
          <label className="text-sm">
            <span className="field-label">Issue date</span>
            <input type="date" value={form.issueDate} onChange={updateField('issueDate')} className={input} />
          </label>
          <label className="text-sm">
            <span className="field-label">Due date</span>
            <input type="date" value={form.dueDate} onChange={updateField('dueDate')} className={input} />
          </label>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Line items</h3>
            <Button type="button" variant="ghost" size="sm" onClick={addLine}>
              <Icon name="plus" className="h-4 w-4" /> Add line
            </Button>
          </div>
          <div className="hidden grid-cols-12 gap-2 px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400 md:grid">
            <span className="col-span-5">Description</span>
            <span className="col-span-1">Qty</span>
            <span className="col-span-2">Price</span>
            <span className="col-span-1">Tax%</span>
            <span className="col-span-2">Disc%</span>
            <span className="col-span-1" />
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input className={`${input} col-span-5`} placeholder="Description" value={l.description} onChange={updateLine(i, 'description')} required />
                <input className={`${input} col-span-1`} type="number" min="0" step="0.01" placeholder="Qty" value={l.quantity} onChange={updateLine(i, 'quantity')} />
                <input className={`${input} col-span-2`} type="number" min="0" step="0.01" placeholder="Price" value={l.unitPrice} onChange={updateLine(i, 'unitPrice')} />
                <input className={`${input} col-span-1`} type="number" min="0" placeholder="Tax%" value={l.taxPercent} onChange={updateLine(i, 'taxPercent')} />
                <input className={`${input} col-span-2`} type="number" min="0" placeholder="Disc%" value={l.discountPercent} onChange={updateLine(i, 'discountPercent')} />
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
            <div className="flex justify-between"><span className="text-ink-500">Discount</span><span className="tabular-nums">−{formatMoney(totals.discountTotal, form.currency)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Tax</span><span className="tabular-nums">{formatMoney(totals.taxTotal, form.currency)}</span></div>
            <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold dark:border-ink-700"><span>Total</span><span className="tabular-nums">{formatMoney(totals.total, form.currency)}</span></div>
          </div>
        </Card>

        <label className="block text-sm">
          <span className="field-label">Notes</span>
          <textarea value={form.notes} onChange={updateField('notes')} rows={2} className={input} />
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save draft' : 'Create draft'}
          </Button>
        </div>
      </form>
    </div>
  );
}
