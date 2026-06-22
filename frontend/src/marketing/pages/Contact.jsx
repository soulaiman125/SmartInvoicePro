import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSEO } from '../useSEO.js';
import Reveal from '../components/Reveal.jsx';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { successPop } from '../../lib/animations.js';

const CHANNELS = [
  { icon: 'mail', title: 'Email us', value: 'hello@smartinvoice.pro', desc: 'We reply within one business day.' },
  { icon: 'zap', title: 'Sales', value: 'sales@smartinvoice.pro', desc: 'Talk to us about Business plans.' },
  { icon: 'shield', title: 'Support', value: 'support@smartinvoice.pro', desc: 'Existing customer? We’re here to help.' },
];

export default function Contact() {
  useSEO('Contact', 'Get in touch with the SmartInvoice Pro team — sales, support and general enquiries.');
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Front-end only: simulate delivery. Wire to a backend endpoint when ready.
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 700);
  };

  const input =
    'w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-xs transition placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100';

  return (
    <div className="pt-32">
      <section className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Contact</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">Let’s talk</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500 dark:text-ink-400">
            Questions about features, pricing or migrating your business? Our team is happy to help.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Channels */}
          <Reveal>
            <div className="space-y-4">
              {CHANNELS.map((c) => (
                <div key={c.title} className="flex items-start gap-4 rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-sm">
                    <Icon name={c.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{c.title}</p>
                    <p className="text-sm font-medium text-brand-600 dark:text-brand-300">{c.value}</p>
                    <p className="mt-0.5 text-xs text-ink-400">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <motion.span variants={successPop} initial="hidden" animate="show" className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Icon name="check" className="h-7 w-7" strokeWidth={3} />
                  </motion.span>
                  <h3 className="mt-4 text-lg font-bold text-ink-900 dark:text-white">Message sent!</h3>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Thanks for reaching out — we’ll be in touch shortly.</p>
                  <Button variant="secondary" size="md" className="mt-6" onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', message: '' }); }}>
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Name</label>
                      <input required value={form.name} onChange={update('name')} className={input} placeholder="Jane Doe" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Email</label>
                      <input required type="email" value={form.email} onChange={update('email')} className={input} placeholder="jane@company.com" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Company</label>
                    <input value={form.company} onChange={update('company')} className={input} placeholder="Acme Inc. (optional)" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Message</label>
                    <textarea required rows={4} value={form.message} onChange={update('message')} className={`${input} resize-none`} placeholder="How can we help?" />
                  </div>
                  <Button type="submit" size="lg" loading={submitting} className="w-full">
                    {submitting ? 'Sending…' : 'Send message'}
                  </Button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
