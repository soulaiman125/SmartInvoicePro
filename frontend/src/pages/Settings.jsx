import { useState } from 'react';
import FormError from "../components/ui/FormError.jsx";
import { useSettings, useUpdateSettings } from '../hooks/useSettings.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/ui/Button.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

const input = 'field-input mt-1';
const card = 'rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900';

export default function Settings() {
  const { data: org, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  // Hydrate once loaded.
  if (org && !form) {
    const a = org.address || {};
    setForm({
      name: org.name || '',
      legalTaxId: org.legalTaxId || '',
      countryCode: org.countryCode || '',
      baseCurrency: org.baseCurrency || 'USD',
      logoUrl: org.logoUrl || '',
      defaultPaymentTermsDays: org.defaultPaymentTermsDays ?? 30,
      timezone: org.timezone || 'UTC',
      line1: a.line1 || '',
      city: a.city || '',
      postalCode: a.postalCode || '',
      addrCountry: a.countryCode || '',
    });
  }

  if (isLoading || !form) return <p className="text-ink-400">Loading settings…</p>;

  const update = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const address = {};
    if (form.line1) address.line1 = form.line1;
    if (form.city) address.city = form.city;
    if (form.postalCode) address.postalCode = form.postalCode;
    if (form.addrCountry) address.countryCode = form.addrCountry.toUpperCase();

    const payload = {
      name: form.name,
      baseCurrency: form.baseCurrency.toUpperCase(),
      defaultPaymentTermsDays: Number(form.defaultPaymentTermsDays) || 0,
      timezone: form.timezone,
      ...(form.legalTaxId ? { legalTaxId: form.legalTaxId } : {}),
      ...(form.countryCode ? { countryCode: form.countryCode.toUpperCase() } : {}),
      ...(form.logoUrl ? { logoUrl: form.logoUrl } : {}),
      ...(Object.keys(address).length ? { address } : {}),
    };

    try {
      await updateSettings.mutateAsync(payload);
      toast.success('Settings saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save settings.');
      toast.error('Could not save settings.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Company profile used on invoices and quotes." />

      <form onSubmit={onSubmit} className="space-y-6">
        <FormError message={error} />

        <div className={card}>
          <h3 className="mb-4 font-semibold">Company</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 text-sm font-medium">Company name<input value={form.name} onChange={update('name')} className={input} required /></label>
            <label className="text-sm font-medium">Tax ID<input value={form.legalTaxId} onChange={update('legalTaxId')} className={input} /></label>
            <label className="text-sm font-medium">Country<input value={form.countryCode} onChange={update('countryCode')} maxLength={2} className={`${input} uppercase`} /></label>
            <label className="col-span-2 text-sm font-medium">Logo URL<input value={form.logoUrl} onChange={update('logoUrl')} placeholder="https://…" className={input} /></label>
          </div>
        </div>

        <div className={card}>
          <h3 className="mb-4 font-semibold">Billing defaults</h3>
          <div className="grid grid-cols-3 gap-4">
            <label className="text-sm font-medium">Base currency<input value={form.baseCurrency} onChange={update('baseCurrency')} maxLength={3} className={`${input} uppercase`} /></label>
            <label className="text-sm font-medium">Payment terms (days)<input type="number" min="0" value={form.defaultPaymentTermsDays} onChange={update('defaultPaymentTermsDays')} className={input} /></label>
            <label className="text-sm font-medium">Timezone<input value={form.timezone} onChange={update('timezone')} className={input} /></label>
          </div>
        </div>

        <div className={card}>
          <h3 className="mb-4 font-semibold">Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 text-sm font-medium">Street<input value={form.line1} onChange={update('line1')} className={input} /></label>
            <label className="text-sm font-medium">City<input value={form.city} onChange={update('city')} className={input} /></label>
            <label className="text-sm font-medium">Postal code<input value={form.postalCode} onChange={update('postalCode')} className={input} /></label>
            <label className="text-sm font-medium">Country<input value={form.addrCountry} onChange={update('addrCountry')} maxLength={2} className={`${input} uppercase`} /></label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
