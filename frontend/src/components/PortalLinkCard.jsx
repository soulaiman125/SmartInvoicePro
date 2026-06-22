import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as portal from '../services/portal.service.js';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';
import { useToast } from '../context/ToastContext.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : 'never');

// Lets the team mint, copy and revoke secure customer-portal links for a client.
export default function PortalLinkCard({ clientId }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [freshUrl, setFreshUrl] = useState('');

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['portal-links', clientId],
    queryFn: () => portal.listPortalLinks(clientId),
  });

  const create = useMutation({
    mutationFn: () => portal.createPortalLink(clientId),
    onSuccess: (res) => {
      setFreshUrl(res.url);
      qc.invalidateQueries({ queryKey: ['portal-links', clientId] });
      navigator.clipboard?.writeText(res.url).then(
        () => toast.success('Portal link created and copied to clipboard.'),
        () => toast.success('Portal link created.'),
      );
    },
    onError: () => toast.error('Could not create a portal link.'),
  });

  const revoke = useMutation({
    mutationFn: (linkId) => portal.revokePortalLink(clientId, linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-links', clientId] });
      toast.info('Portal link revoked.');
    },
    onError: () => toast.error('Could not revoke the link.'),
  });

  const copy = (url) => {
    navigator.clipboard?.writeText(url).then(
      () => toast.success('Link copied to clipboard.'),
      () => toast.error('Could not copy.'),
    );
  };

  const active = links.filter((l) => l.active);

  return (
    <div className="mt-6 rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
            <Icon name="link" className="h-4 w-4 text-brand-500" /> Customer portal
          </h3>
          <p className="mt-1 text-xs text-ink-400">
            Share a secure link so this client can view invoices, quotes and payments — no login required.
          </p>
        </div>
        <Button size="sm" loading={create.isPending} onClick={() => create.mutate()}>
          <Icon name="plus" className="h-4 w-4" /> New link
        </Button>
      </div>

      {freshUrl && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 dark:border-brand-500/30 dark:bg-brand-500/10">
          <input readOnly value={freshUrl} className="flex-1 truncate bg-transparent text-xs text-ink-700 outline-none dark:text-ink-200" />
          <button type="button" onClick={() => copy(freshUrl)} className="text-brand-600 hover:text-brand-700" aria-label="Copy link">
            <Icon name="copy" className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-ink-400">Loading…</p>
        ) : active.length === 0 ? (
          <p className="text-sm text-ink-400">No active portal links.</p>
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {active.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ink-700 dark:text-ink-200">Active link</p>
                  <p className="text-xs text-ink-400">
                    Created {fmtDate(l.createdAt)} · expires {fmtDate(l.expiresAt)} · last viewed {fmtDate(l.lastAccessedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revoke.mutate(l.id)}
                  className="shrink-0 text-xs font-semibold text-red-500 hover:underline"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
