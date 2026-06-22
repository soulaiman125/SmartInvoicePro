import { useState } from 'react';
import FormError from "./ui/FormError.jsx";
import Modal from './Modal.jsx';
import Button from './ui/Button.jsx';
import { Field, Input, Select } from './ui/Field.jsx';
import { useRecordPayment } from '../hooks/usePayments.js';
import { useToast } from '../context/ToastContext.jsx';
import { toMinorUnits, toMajorUnits, formatMoney } from '../utils/money.js';

export default function RecordPaymentModal({ invoice, onClose }) {
  const balance = Number(invoice.balanceDue);
  const [amount, setAmount] = useState(toMajorUnits(invoice.balanceDue));
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [error, setError] = useState(null);
  const recordPayment = useRecordPayment();
  const toast = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await recordPayment.mutateAsync({
        invoiceId: invoice.id,
        payload: {
          amount: toMinorUnits(amount),
          method,
          ...(reference ? { reference } : {}),
        },
      });
      toast.success('Payment recorded.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record payment.');
    }
  };

  return (
    <Modal title="Record payment" onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        <div className="rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm dark:border-ink-800 dark:bg-ink-850/40">
          <span className="text-ink-500 dark:text-ink-400">Outstanding balance</span>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-ink-900 dark:text-white">
            {formatMoney(balance, invoice.currency)}
          </p>
        </div>
        <Field label="Amount" required>
          <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="bank_transfer">Bank transfer</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="paypal">PayPal</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Reference">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" loading={recordPayment.isPending}>
            {recordPayment.isPending ? 'Saving…' : 'Record payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
