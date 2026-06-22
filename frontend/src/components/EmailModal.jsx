import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';
import { useEmailHistory, useRetryEmail } from '../hooks/useEmails.js';
import { useToast } from '../context/ToastContext.jsx';

const STATUS = {
  sent: { label: 'Sent', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  queued: { label: 'Queued', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  failed: { label: 'Failed', cls: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
};

function EmailStatusBadge({ status }) {
  const s = STATUS[status] || STATUS.queued;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

const TYPE_LABEL = {
  invoice: 'Invoice',
  quote: 'Quotation',
  payment_reminder: 'Payment reminder',
  invoice_paid: 'Payment receipt',
  welcome: 'Welcome',
};

// Reusable email panel: compose (with recipient override) + delivery history.
// `actions` is an array of { key, label, variant?, icon?, run(to) => Promise }.
export default function EmailModal({ entityType, entityId, defaultEmail = '', actions = [], onClose, title = 'Send email' }) {
  const [to, setTo] = useState(defaultEmail);
  const [busyKey, setBusyKey] = useState(null);
  const { data, isLoading } = useEmailHistory({ entityType, entityId });
  const retry = useRetryEmail();
  const toast = useToast();
  const history = data?.data ?? [];

  const run = async (action) => {
    setBusyKey(action.key);
    try {
      const log = await action.run(to.trim() || undefined);
      if (log?.status === 'failed') toast.error(`Delivery failed: ${log.error || 'unknown error'}`);
      else toast.success(`${action.label} — sent to ${log?.toEmail || to}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send the email.');
    } finally {
      setBusyKey(null);
    }
  };

  const onRetry = async (id) => {
    try {
      const log = await retry.mutateAsync(id);
      if (log?.status === 'sent') toast.success('Email re-sent.');
      else toast.error(`Retry failed: ${log?.error || 'unknown error'}`);
    } catch {
      toast.error('Could not retry the email.');
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">Recipient</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="client@example.com"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-800"
          />
          <p className="mt-1 text-xs text-ink-400">Leave blank to use the client&apos;s email on file. A PDF is attached automatically.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button key={a.key} size="sm" variant={a.variant || 'primary'} loading={busyKey === a.key} onClick={() => run(a)}>
              {a.icon && <Icon name={a.icon} className="h-4 w-4" />} {a.label}
            </Button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Delivery history</p>
          {isLoading ? (
            <p className="py-4 text-center text-sm text-ink-400">Loading…</p>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-200 py-6 text-center dark:border-ink-700">
              <Icon name="mail" className="mx-auto h-6 w-6 text-ink-300" />
              <p className="mt-1 text-sm text-ink-400">No emails sent yet.</p>
            </div>
          ) : (
            <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {history.map((e) => (
                <li key={e.id} className="flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm dark:border-ink-800">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-800 dark:text-ink-100">{TYPE_LABEL[e.type] || e.type}</p>
                    <p className="truncate text-xs text-ink-400">
                      {e.toEmail} · {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <EmailStatusBadge status={e.status} />
                  {e.status === 'failed' && (
                    <button type="button" onClick={() => onRetry(e.id)} className="text-xs font-semibold text-brand-600 hover:underline">
                      Retry
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
