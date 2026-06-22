import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from './ui/Button.jsx';
import FormError from './ui/FormError.jsx';
import { Field, Input, Select, Textarea } from './ui/Field.jsx';
import { useCreateClient, useUpdateClient } from '../hooks/useClients.js';

function initialForm(client) {
  const addr = client?.billingAddress ?? {};
  return {
    name: client?.name ?? '',
    type: client?.type ?? 'company',
    email: client?.email ?? '',
    taxId: client?.taxId ?? '',
    preferredCurrency: client?.preferredCurrency ?? '',
    line1: addr.line1 ?? '',
    city: addr.city ?? '',
    postalCode: addr.postalCode ?? '',
    countryCode: addr.countryCode ?? '',
    notes: client?.notes ?? '',
  };
}

// `client` is null for create, or an existing record for edit.
export default function ClientFormModal({ client, onClose }) {
  const isEdit = Boolean(client);
  const [form, setForm] = useState(() => initialForm(client));
  const [error, setError] = useState(null);

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const saving = createClient.isPending || updateClient.isPending;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const billingAddress = {};
    if (form.line1) billingAddress.line1 = form.line1;
    if (form.city) billingAddress.city = form.city;
    if (form.postalCode) billingAddress.postalCode = form.postalCode;
    if (form.countryCode) billingAddress.countryCode = form.countryCode.toUpperCase();

    const payload = {
      name: form.name,
      type: form.type,
      ...(form.email ? { email: form.email } : {}),
      ...(form.taxId ? { taxId: form.taxId } : {}),
      ...(form.preferredCurrency
        ? { preferredCurrency: form.preferredCurrency.toUpperCase() }
        : {}),
      ...(Object.keys(billingAddress).length ? { billingAddress } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    };

    try {
      if (isEdit) {
        await updateClient.mutateAsync({ id: client.id, payload });
      } else {
        await createClient.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.issues?.[0]?.message || data?.message || 'Could not save client.');
    }
  };

  return (
    <Modal title={isEdit ? 'Edit client' : 'New client'} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
        <FormError message={error} className="mb-4" />

        <div className="mb-5 grid grid-cols-2 gap-4">
          <Field label="Name" required className="col-span-2">
            <Input value={form.name} onChange={update('name')} required />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={update('type')}>
              <option value="company">Company</option>
              <option value="individual">Individual</option>
            </Select>
          </Field>
          <Field label="Currency">
            <Input value={form.preferredCurrency} onChange={update('preferredCurrency')} maxLength={3} placeholder="USD" className="uppercase" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={update('email')} />
          </Field>
          <Field label="Tax ID">
            <Input value={form.taxId} onChange={update('taxId')} />
          </Field>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
          Billing address
        </p>
        <div className="mb-5 grid grid-cols-2 gap-4">
          <Field label="Street" className="col-span-2">
            <Input value={form.line1} onChange={update('line1')} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={update('city')} />
          </Field>
          <Field label="Postal code">
            <Input value={form.postalCode} onChange={update('postalCode')} />
          </Field>
          <Field label="Country" className="col-span-2">
            <Input value={form.countryCode} onChange={update('countryCode')} maxLength={2} placeholder="US" className="uppercase" />
          </Field>
        </div>

        <Field label="Notes" className="mb-6">
          <Textarea value={form.notes} onChange={update('notes')} rows={2} />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
