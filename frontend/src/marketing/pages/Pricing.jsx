import { useSEO } from '../useSEO.js';
import Reveal from '../components/Reveal.jsx';
import PricingCards from '../components/PricingCards.jsx';
import FAQ from '../components/FAQ.jsx';
import Icon from '../../components/ui/Icon.jsx';

const GUARANTEES = [
  { icon: 'shield', label: 'Cancel anytime' },
  { icon: 'lock', label: 'Secure & encrypted' },
  { icon: 'zap', label: 'Set up in minutes' },
];

export default function Pricing() {
  useSEO('Pricing', 'Simple, transparent pricing. Start free with the Starter plan, or unlock more with Pro and Business.');
  return (
    <div className="pt-32">
      <section className="relative overflow-hidden pb-8">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/10 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Pricing</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
              Pricing that scales with you
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500 dark:text-ink-400">
              Start free forever. Upgrade to unlock premium PDFs, email delivery, the customer portal and advanced reports.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-500 dark:text-ink-400">
              {GUARANTEES.map((g) => (
                <span key={g.label} className="inline-flex items-center gap-1.5">
                  <Icon name={g.icon} className="h-4 w-4 text-brand-500" /> {g.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PricingCards />
        <p className="mt-8 text-center text-sm text-ink-400">
          All plans include unlimited clients & products, dark mode, and your data export anytime.
        </p>
      </section>

      <FAQ subheading="Questions about plans and billing? We've got answers." />
    </div>
  );
}
