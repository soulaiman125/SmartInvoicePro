import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClients } from '../hooks/useClients.js';
import { useSettings } from '../hooks/useSettings.js';
import { useCreateRecurring, useUpdateRecurring } from '../hooks/useRecurring.js';
import { useToast } from '../context/ToastContext.jsx';
import { previewTotals, formatMoney, toMinorUnits, toMajorUnits } from '../utils/money.js';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';

const input = 'field-input';
const blankLine = { description: '', quantity: 1, unitPrice: '', taxPercent: 0, discountPercent: 0 };
const today = () => new Date().toISOString().slice(0, 10);

export default function RecurringFormModal({ recurring, onClose }) {
  const isEdit = Boolean(recurring);
  const panelRef = useRef(null);
  const { data: clientsPage } = useClients({ pageSize: 100 });
  const { data: org } = useSettings();
  const create = useCreateRecurring();
  const update = useUpdateRecurring();
  const toast = useToast();

  const defaultTaxPercent = org?.settings?.defaultTaxBps != null ? org.settings.defaultTaxBps / 100 : 0;

  const [form, setForm] = useState({
    clientId: recurring?.clientId || '',
    frequency: recurring?.frequency || 'monthly',
    currency: recurring?.currency || org?.baseCurrency || 'USD',
    startDate: recurring?.startDate ? recurring.startDate.slice(0, 10) : today(),
    dueInDays: recurring?.dueInDays ?? org?.defaultPaymentTermsDays ?? 30,
    autoIssue: recurring?.autoIssue ?? true,
    notes: recurring?.notes || '',
  });
  const [lines, setLines] = useState(
    recurring?.items?.length
      ? recurring.items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: toMajorUnits(it.unitPrice),
          taxPercent: (it.taxRateBasisPoints || 0) / 100,
          discountPercent: (it.discountBasisPoints || 0) / 100,
        }))
      : [{ ...blankLine, taxPercent: defaultTaxPercent }],
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const clients = clientsPage?.data ?? [];
  const totals = useMemo(() => previewTotals(lines), [lines]);
  const saving = create.isPending || update.isPending;

  const setField = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const setLine = (i, f) => (e) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [f]: e.target.value } : l)));
  const addLine = () => setLines((ls) => [...ls, { ...blankLine, taxPercent: defaultTaxPercent }]);
  const removeLine = (i) => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      clientId: form.clientId,
      frequency: form.frequency,
      currency: form.currency.toUpperCase(),
      startDate: form.startDate,
      dueInDays: Number(form.dueInDays) || 0,
      autoIssue: form.autoIssue,
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
      if (isEdit) await update.mutateAsync({ id: recurring.id, payload });
      else await create.mutateAsync(payload);
      toast.success(isEdit ? 'Recurring schedule updated.' : 'Recurring schedule created.');
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.issues?.[0]?.message || data?.message || 'Could not save the schedule.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={isEdit ? 'Edit recurring invoice' : 'New recurring invoice'}
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="my-8 w-full max-w-2xl rounded-2xl border border-ink-200 bg-white p-6 shadow-popover outline-none dark:border-ink-800 dark:bg-ink-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{isEdit ? 'Edit recurring invoice' : 'New recurring invoice'}</h3>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800" aria-label="Close">✕</button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">{error}</p>}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <label className="col-span-2 text-sm md:col-span-1">
                <span className="field-label">Client</span>
                <select value={form.clientId} onChange={setField('clientId')} className={`${input} cursor-pointer`} required>
                  <option value="">Select…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="field-label">Frequency</span>
                <select value={form.frequency} onChange={setField('frequency')} className={`${input} cursor-pointer`}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="field-label">Start date</span>
                <input type="date" value={form.startDate} onChange={setField('startDate')} className={input} required />
              </label>
              <label className="text-sm">
                <span className="field-label">Due in (days)</span>
                <input type="number" min="0" max="365" value={form.dueInDays} onChange={setField('dueInDays')} className={input} />
              </label>
              <label className="text-sm">
                <span className="field-label">Currency</span>
                <input value={form.currency} onChange={setField('currency')} maxLength={3} className={`${input} uppercase`} />
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input type="checkbox" checked={form.autoIssue} onChange={(e) => setForm((s) => ({ ...s, autoIssue: e.target.checked }))} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                <span>Auto-issue invoices</span>
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="field-label !mb-0">Line items</span>
                <Button type="button" variant="ghost" size="sm" onClick={addLine}><Icon name="plus" className="h-4 w-4" /> Add line</Button>
              </div>
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input className={`${input} col-span-5`} placeholder="Description" value={l.description} onChange={setLine(i, 'description')} required />
                    <input className={`${input} col-span-2`} type="number" min="0" step="0.01" placeholder="Qty" value={l.quantity} onChange={setLine(i, 'quantity')} />
                    <input className={`${input} col-span-2`} type="number" min="0" step="0.01" placeholder="Price" value={l.unitPrice} onChange={setLine(i, 'unitPrice')} />
                    <input className={`${input} col-span-2`} type="number" min="0" placeholder="Tax%" value={l.taxPercent} onChange={setLine(i, 'taxPercent')} />
                    <button type="button" onClick={() => removeLine(i)} className="col-span-1 flex items-center justify-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label="Remove line">
                      <Icon name="close" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="ml-auto mt-3 w-56 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="tabular-nums">{formatMoney(totals.subtotal, form.currency)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Tax</span><span className="tabular-nums">{formatMoney(totals.taxTotal, form.currency)}</span></div>
                <div className="flex justify-between border-t border-ink-200 pt-1.5 font-bold dark:border-ink-700"><span>Total / cycle</span><span className="tabular-nums">{formatMoney(totals.total, form.currency)}</span></div>
              </div>
            </div>

            <label className="block text-sm">
              <span className="field-label">Notes</span>
              <textarea value={form.notes} onChange={setField('notes')} rows={2} className={input} />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={saving}>{isEdit ? 'Save schedule' : 'Create schedule'}</Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
