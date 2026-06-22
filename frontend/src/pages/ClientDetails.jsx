import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useClient, useDeleteClient } from '../hooks/useClients.js';
import ClientFormModal from '../components/ClientFormModal.jsx';
import PortalLinkCard from '../components/PortalLinkCard.jsx';
import Avatar from '../components/Avatar.jsx';
import Badge from '../components/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';

function formatAddress(addr) {
  if (!addr || Object.keys(addr).length === 0) return null;
  const lines = [
    addr.line1,
    addr.line2,
    [addr.postalCode, addr.city].filter(Boolean).join(' '),
    addr.region,
    addr.countryCode,
  ].filter(Boolean);
  return lines;
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 text-sm text-ink-800 dark:text-ink-200">{children || <span className="text-ink-400">—</span>}</dd>
    </div>
  );
}

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading, isError } = useClient(id);
  const deleteClient = useDeleteClient();
  const [editing, setEditing] = useState(false);

  const onDelete = async () => {
    if (!window.confirm('Delete this client? Clients with invoices are archived instead.')) return;
    await deleteClient.mutateAsync(id);
    navigate('/clients', { replace: true });
  };

  if (isLoading) {
    return <div className="text-ink-400">Loading client…</div>;
  }
  if (isError || !client) {
    return (
      <div>
        <p className="text-red-500">Client not found.</p>
        <Link to="/clients" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          ← Back to clients
        </Link>
      </div>
    );
  }

  const billing = formatAddress(client.billingAddress);
  const shipping = formatAddress(client.shippingAddress);

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/clients" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <Icon name="chevron" className="h-4 w-4" /> Back to clients
      </Link>

      <div className="mt-4 rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={client.name} size="lg" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">{client.name}</h2>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge color={client.type === 'company' ? 'blue' : 'gray'}>
                  {client.type}
                </Badge>
                {client.archivedAt && <Badge color="amber">Archived</Badge>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Email">
            {client.email && (
              <a href={`mailto:${client.email}`} className="text-brand-600 hover:underline">
                {client.email}
              </a>
            )}
          </Field>
          <Field label="Tax ID">{client.taxId}</Field>
          <Field label="Preferred currency">{client.preferredCurrency}</Field>
          <Field label="Preferred language">{client.preferredLanguage}</Field>

          <Field label="Billing address">
            {billing ? (
              <address className="not-italic">
                {billing.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </address>
            ) : null}
          </Field>
          <Field label="Shipping address">
            {shipping ? (
              <address className="not-italic">
                {shipping.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </address>
            ) : null}
          </Field>

          <div className="sm:col-span-2">
            <Field label="Notes">{client.notes}</Field>
          </div>
          <Field label="Created">
            {new Date(client.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Field>
        </dl>
      </div>

      {!client.archivedAt && <PortalLinkCard clientId={client.id} />}

      {editing && <ClientFormModal client={client} onClose={() => setEditing(false)} />}
    </div>
  );
}
