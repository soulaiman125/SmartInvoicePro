import { useState } from 'react';
import FormError from "../components/ui/FormError.jsx";
import { useSettings, useUpdateSettings } from '../hooks/useSettings.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
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
      invoicePrefix: org.settings?.invoicePrefix || 'INV',
      quotePrefix: org.settings?.quotePrefix || 'QUO',
      brandColor: org.settings?.brandColor || '#3563e9',
      defaultTaxPercent: org.settings?.defaultTaxBps != null ? String(org.settings.defaultTaxBps / 100) : '',
    });
  }

  if (isLoading || !form) return <p className="text-ink-400">Loading settings…</p>;

  const update = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const onLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError('Logo image must be under 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((s) => ({ ...s, logoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const address = {};
    if (form.line1) address.line1 = form.line1;
    if (form.city) address.city = form.city;
    if (form.postalCode) address.postalCode = form.postalCode;
    if (form.addrCountry) address.countryCode = form.addrCountry.toUpperCase();

    // Merge branding/numbering into the existing settings JSON (never clobber it).
    const settings = {
      ...(org.settings || {}),
      invoicePrefix: (form.invoicePrefix || 'INV').toUpperCase(),
      quotePrefix: (form.quotePrefix || 'QUO').toUpperCase(),
      brandColor: form.brandColor || '#3563e9',
    };
    if (form.defaultTaxPercent !== '' && !Number.isNaN(Number(form.defaultTaxPercent))) {
      settings.defaultTaxBps = Math.round(Number(form.defaultTaxPercent) * 100);
    }

    const payload = {
      name: form.name,
      baseCurrency: form.baseCurrency.toUpperCase(),
      defaultPaymentTermsDays: Number(form.defaultPaymentTermsDays) || 0,
      timezone: form.timezone,
      logoUrl: form.logoUrl || '',
      settings,
      ...(form.legalTaxId ? { legalTaxId: form.legalTaxId } : {}),
      ...(form.countryCode ? { countryCode: form.countryCode.toUpperCase() } : {}),
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
            <div className="col-span-2">
              <span className="text-sm font-medium">Company logo</span>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-800">
                  {form.logoUrl
                    ? <img src={form.logoUrl} alt="Company logo" className="h-full w-full object-contain" />
                    : <Icon name="products" className="h-5 w-5 text-ink-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={onLogoFile}
                    className="block w-full text-sm text-ink-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/15 dark:file:text-brand-300"
                  />
                  <input value={form.logoUrl} onChange={update('logoUrl')} placeholder="…or paste an image URL / data URI" className={`${input} mt-2`} />
                </div>
                {form.logoUrl && (
                  <button type="button" onClick={() => setForm((s) => ({ ...s, logoUrl: '' }))} className="shrink-0 text-xs font-medium text-red-500 hover:underline">
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-400">Shown on invoices, quotes and the customer portal. PNG/SVG, under 1.5 MB.</p>
            </div>
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
          <h3 className="mb-4 font-semibold">Branding & numbering</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium">Invoice prefix<input value={form.invoicePrefix} onChange={update('invoicePrefix')} maxLength={8} placeholder="INV" className={`${input} uppercase`} /></label>
            <label className="text-sm font-medium">Quote prefix<input value={form.quotePrefix} onChange={update('quotePrefix')} maxLength={8} placeholder="QUO" className={`${input} uppercase`} /></label>
            <label className="text-sm font-medium">Default tax (%)<input type="number" min="0" step="0.01" value={form.defaultTaxPercent} onChange={update('defaultTaxPercent')} placeholder="e.g. 10" className={input} /></label>
            <label className="text-sm font-medium">Brand color
              <span className="mt-1 flex items-center gap-2">
                <input type="color" value={form.brandColor} onChange={update('brandColor')} className="h-9 w-12 shrink-0 cursor-pointer rounded border border-ink-200 dark:border-ink-700" aria-label="Brand color" />
                <input value={form.brandColor} onChange={update('brandColor')} className={input} />
              </span>
            </label>
          </div>
          <p className="mt-3 text-xs text-ink-400">Prefixes apply to new number series (e.g. next fiscal year). Brand color themes your PDF documents.</p>
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
