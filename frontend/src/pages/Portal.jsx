import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPortal, portalPdfUrl } from '../services/portal.service.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { formatMoney } from '../utils/money.js';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

function SummaryCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</p>
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {title}
        {count != null && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{count}</span>}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{children}</div>
    </section>
  );
}

export default function Portal() {
  const { token } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['portal', token],
    queryFn: () => getPortal(token),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-400">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
          Loading your portal…
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <Icon name="alert" className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Link unavailable</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            This portal link is invalid, has been revoked, or has expired. Please contact us for a new link.
          </p>
        </div>
      </div>
    );
  }

  const { organization: org, client, invoices, quotes, payments, summary } = data;
  const accent = org.brandColor || '#4F46E5';
  const cur = org.currency;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Branded header */}
      <header className="text-white" style={{ background: `linear-gradient(135deg, ${accent}, #6366f1)` }}>
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-6 sm:px-6">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className="h-10 max-w-[160px] object-contain" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold" style={{ color: accent }}>
              {org.name?.[0]?.toUpperCase() || 'S'}
            </span>
          )}
          <div>
            <p className="text-lg font-bold leading-tight">{org.name}</p>
            <p className="text-sm text-white/80">Customer portal</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="-mt-4 mb-2">
          <p className="text-sm text-slate-500">Welcome back,</p>
          <h1 className="text-2xl font-bold text-slate-900">{client?.name}</h1>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard label="Total billed" value={formatMoney(summary.totalBilled, cur)} />
          <SummaryCard label="Total paid" value={formatMoney(summary.totalPaid, cur)} accent="#059669" />
          <SummaryCard label="Outstanding" value={formatMoney(summary.outstanding, cur)} accent={summary.outstanding > 0 ? '#d97706' : undefined} />
        </div>

        {/* Invoices */}
        <Section title="Invoices" count={invoices.length}>
          {invoices.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No invoices yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-800">{inv.number}</span>
                  <StatusBadge status={inv.status} />
                  <span className="text-slate-400">Due {fmtDate(inv.dueDate)}</span>
                  <span className="ml-auto font-semibold tabular-nums text-slate-900">{formatMoney(inv.total, inv.currency)}</span>
                  <a
                    href={portalPdfUrl(token, 'invoices', inv.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-slate-100"
                    style={{ color: accent }}
                  >
                    <Icon name="download" className="h-4 w-4" /> PDF
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Quotes */}
        {quotes.length > 0 && (
          <Section title="Quotations" count={quotes.length}>
            <ul className="divide-y divide-slate-100">
              {quotes.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-800">{q.number}</span>
                  <StatusBadge status={q.status} />
                  <span className="text-slate-400">Valid until {fmtDate(q.validUntil)}</span>
                  <span className="ml-auto font-semibold tabular-nums text-slate-900">{formatMoney(q.total, q.currency)}</span>
                  <a
                    href={portalPdfUrl(token, 'quotes', q.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-slate-100"
                    style={{ color: accent }}
                  >
                    <Icon name="download" className="h-4 w-4" /> PDF
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Payments */}
        {payments.length > 0 && (
          <Section title="Payment history" count={payments.length}>
            <ul className="divide-y divide-slate-100">
              {payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <span className="text-slate-600">{fmtDate(p.paidAt)}</span>
                  <span className="capitalize text-slate-400">{p.method?.replace('_', ' ')}</span>
                  {p.invoice?.number && <span className="text-slate-400">{p.invoice.number}</span>}
                  <span className="ml-auto font-semibold tabular-nums text-emerald-600">{formatMoney(p.amount, p.currency)}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          Powered by SmartInvoice Pro · Secure customer portal
        </p>
      </main>
    </div>
  );
}
