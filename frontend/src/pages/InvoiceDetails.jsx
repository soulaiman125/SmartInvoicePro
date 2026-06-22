import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  useInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useDeleteInvoice,
} from '../hooks/useInvoices.js';
import { useInvoicePayments, useRefundPayment } from '../hooks/usePayments.js';
import StatusBadge from '../components/StatusBadge.jsx';
import RecordPaymentModal from '../components/RecordPaymentModal.jsx';
import PdfMenu from '../components/PdfMenu.jsx';
import EmailModal from '../components/EmailModal.jsx';
import { useSendInvoiceEmail, useSendInvoiceReminder } from '../hooks/useEmails.js';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { formatMoney } from '../utils/money.js';
import { useToast } from '../context/ToastContext.jsx';

const card = 'rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900';

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading, isError } = useInvoice(id);
  const { data: payments = [] } = useInvoicePayments(id);
  const issueInvoice = useIssueInvoice();
  const cancelInvoice = useCancelInvoice();
  const deleteInvoice = useDeleteInvoice();
  const refundPayment = useRefundPayment();
  const sendInvoiceEmail = useSendInvoiceEmail();
  const sendReminder = useSendInvoiceReminder();
  const toast = useToast();
  const [paying, setPaying] = useState(false);
  const [emailing, setEmailing] = useState(false);

  if (isLoading) return <p className="text-ink-400">Loading invoice…</p>;
  if (isError || !invoice) {
    return (
      <div>
        <p className="text-red-500">Invoice not found.</p>
        <Link to="/invoices" className="text-sm text-brand-600 hover:underline">← Back to invoices</Link>
      </div>
    );
  }

  const isDraft = invoice.status === 'draft';
  const isOpen = !['draft', 'paid', 'cancelled'].includes(invoice.status);

  const onIssue = async () => {
    if (window.confirm('Issue this invoice? It will be assigned a number and locked.')) {
      try {
        await issueInvoice.mutateAsync(id);
        toast.success('Invoice issued.');
      } catch {
        toast.error('Could not issue invoice.');
      }
    }
  };
  const onCancel = async () => {
    if (window.confirm('Cancel this invoice (issues a credit note)?')) {
      try {
        await cancelInvoice.mutateAsync({ id });
        toast.info('Invoice cancelled.');
      } catch {
        toast.error('Could not cancel invoice.');
      }
    }
  };
  const onDelete = async () => {
    if (window.confirm('Delete this draft invoice?')) {
      await deleteInvoice.mutateAsync(id);
      navigate('/invoices', { replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/invoices" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <Icon name="chevron" className="h-4 w-4" /> Invoices
      </Link>

      <div className={`mt-4 ${card}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{invoice.number || 'Draft invoice'}</h2>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={invoice.status} />
              <span className="text-sm text-ink-500">{invoice.client?.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <PdfMenu basePath="invoices" id={id} number={invoice.number} kind="invoice" />
            {!isDraft && (
              <Button variant="secondary" size="sm" onClick={() => setEmailing(true)}>
                <Icon name="mail" className="h-4 w-4" /> Email
              </Button>
            )}
            {isDraft && (
              <>
                <Link to={`/invoices/${id}/edit`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
                <Button size="sm" onClick={onIssue}>Issue</Button>
                <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
              </>
            )}
            {isOpen && (
              <>
                <Button variant="success" size="sm" onClick={() => setPaying(true)}>Record payment</Button>
                <Button variant="danger" size="sm" onClick={onCancel}>Cancel</Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-200 text-xs uppercase text-ink-500 dark:border-ink-800">
              <tr>
                <th className="py-2 font-semibold">Description</th>
                <th className="py-2 text-right font-semibold">Qty</th>
                <th className="py-2 text-right font-semibold">Price</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
              {invoice.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5">{it.description}</td>
                  <td className="py-2.5 text-right tabular-nums">{Number(it.quantity)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(it.unitPrice, invoice.currency)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(it.lineTotal, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-5 w-60 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="tabular-nums">{formatMoney(invoice.subtotal, invoice.currency)}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Discount</span><span className="tabular-nums">−{formatMoney(invoice.discountTotal, invoice.currency)}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Tax</span><span className="tabular-nums">{formatMoney(invoice.taxTotal, invoice.currency)}</span></div>
          <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold dark:border-ink-700"><span>Total</span><span className="tabular-nums">{formatMoney(invoice.total, invoice.currency)}</span></div>
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Paid</span><span className="tabular-nums">{formatMoney(invoice.amountPaid, invoice.currency)}</span></div>
          <div className="flex justify-between font-semibold"><span>Balance</span><span className="tabular-nums">{formatMoney(invoice.balanceDue, invoice.currency)}</span></div>
        </div>
      </div>

      <div className={`mt-6 ${card}`}>
        <h3 className="mb-4 text-sm font-semibold">Payment history</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-ink-400">No payments recorded.</p>
        ) : (
          <ul className="divide-y divide-ink-100 text-sm dark:divide-ink-800">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</span>
                <span className="capitalize text-ink-500">{p.method.replace('_', ' ')}</span>
                <span className={`tabular-nums ${p.status === 'refunded' ? 'text-ink-400 line-through' : 'font-medium'}`}>
                  {formatMoney(p.amount, p.currency)}
                </span>
                {p.status === 'refunded' ? (
                  <span className="text-xs text-ink-400">refunded</span>
                ) : (
                  <button type="button" onClick={() => refundPayment.mutate(p.id)} className="text-xs font-medium text-red-500 hover:underline">
                    Refund
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {paying && <RecordPaymentModal invoice={invoice} onClose={() => setPaying(false)} />}
      {emailing && (
        <EmailModal
          title="Email invoice"
          entityType="invoice"
          entityId={id}
          defaultEmail={invoice.client?.email || ''}
          onClose={() => setEmailing(false)}
          actions={[
            { key: 'send', label: 'Send invoice', icon: 'send', run: (to) => sendInvoiceEmail.mutateAsync({ id, to }) },
            { key: 'reminder', label: 'Send reminder', icon: 'clock', variant: 'secondary', run: (to) => sendReminder.mutateAsync({ id, to }) },
          ]}
        />
      )}
    </div>
  );
}
