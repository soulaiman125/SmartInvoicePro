import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  useQuotation,
  useSetQuotationStatus,
  useConvertQuotation,
  useDeleteQuotation,
} from '../hooks/useQuotations.js';
import { useState } from 'react';
import StatusBadge from '../components/StatusBadge.jsx';
import PdfMenu from '../components/PdfMenu.jsx';
import EmailModal from '../components/EmailModal.jsx';
import { useSendQuoteEmail } from '../hooks/useEmails.js';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { formatMoney } from '../utils/money.js';

const card = 'rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900';

export default function QuoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: quote, isLoading, isError } = useQuotation(id);
  const setStatus = useSetQuotationStatus();
  const convert = useConvertQuotation();
  const remove = useDeleteQuotation();
  const sendQuoteEmail = useSendQuoteEmail();
  const [emailing, setEmailing] = useState(false);

  if (isLoading) return <p className="text-ink-400">Loading quote…</p>;
  if (isError || !quote) {
    return (
      <div>
        <p className="text-red-500">Quote not found.</p>
        <Link to="/quotes" className="text-sm text-brand-600 hover:underline">← Back to quotes</Link>
      </div>
    );
  }

  const editable = ['draft', 'sent'].includes(quote.status);

  const onConvert = async () => {
    const invoice = await convert.mutateAsync(id);
    navigate(`/invoices/${invoice.id}`);
  };
  const onDelete = async () => {
    if (window.confirm('Delete this quote?')) {
      await remove.mutateAsync(id);
      navigate('/quotes', { replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/quotes" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <Icon name="chevron" className="h-4 w-4" /> Quotations
      </Link>

      <div className={`mt-4 ${card}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{quote.number || 'Draft quote'}</h2>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={quote.status} />
              <span className="text-sm text-ink-500">{quote.client?.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <PdfMenu basePath="quotations" id={id} number={quote.number} kind="quote" />
            {quote.number && (
              <Button variant="secondary" size="sm" onClick={() => setEmailing(true)}>
                <Icon name="mail" className="h-4 w-4" /> Email
              </Button>
            )}
            {editable && (
              <Link to={`/quotes/${id}/edit`}>
                <Button variant="secondary" size="sm">Edit</Button>
              </Link>
            )}
            {quote.status === 'draft' && (
              <Button size="sm" onClick={() => setStatus.mutate({ id, status: 'sent' })}>Mark sent</Button>
            )}
            {quote.status === 'sent' && (
              <>
                <Button variant="success" size="sm" onClick={() => setStatus.mutate({ id, status: 'accepted' })}>Accept</Button>
                <Button variant="danger" size="sm" onClick={() => setStatus.mutate({ id, status: 'declined' })}>Decline</Button>
              </>
            )}
            {quote.status === 'accepted' && (
              <Button size="sm" onClick={onConvert} loading={convert.isPending}>
                {convert.isPending ? 'Converting…' : 'Convert to invoice'}
              </Button>
            )}
            {quote.status !== 'accepted' && (
              <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
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
              {quote.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5">{it.description}</td>
                  <td className="py-2.5 text-right tabular-nums">{Number(it.quantity)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(it.unitPrice, quote.currency)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(it.lineTotal, quote.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-5 w-60 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="tabular-nums">{formatMoney(quote.subtotal, quote.currency)}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Tax</span><span className="tabular-nums">{formatMoney(quote.taxTotal, quote.currency)}</span></div>
          <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold dark:border-ink-700"><span>Total</span><span className="tabular-nums">{formatMoney(quote.total, quote.currency)}</span></div>
        </div>
      </div>

      {emailing && (
        <EmailModal
          title="Email quotation"
          entityType="quote"
          entityId={id}
          defaultEmail={quote.client?.email || ''}
          onClose={() => setEmailing(false)}
          actions={[
            { key: 'send', label: 'Send quotation', icon: 'send', run: (to) => sendQuoteEmail.mutateAsync({ id, to }) },
          ]}
        />
      )}
    </div>
  );
}
