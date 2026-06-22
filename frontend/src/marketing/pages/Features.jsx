import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import Button from '../../components/ui/Button.jsx';
import { useSEO } from '../useSEO.js';
import { FEATURES } from '../content.js';
import Reveal from '../components/Reveal.jsx';
import MockBrowser from '../components/MockBrowser.jsx';
import DashboardMock from '../components/DashboardMock.jsx';

export default function Features() {
  useSEO('Features', 'Invoicing, quotes, inventory, clients, payments, reports and dashboard analytics — everything in one platform.');
  return (
    <div className="pt-32">
      <section className="relative overflow-hidden pb-12">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/10 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Features</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
              One platform to run your billing
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500 dark:text-ink-400">
              From the first quote to the final payment — SmartInvoice Pro replaces a stack of tools with one beautifully designed product.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        <Reveal>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/15 to-accent-500/15 blur-2xl" />
            <MockBrowser><DashboardMock /></MockBrowser>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.06}>
              <div className="flex h-full flex-col rounded-2xl border border-ink-200/80 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-sm">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{f.desc}</p>
                <ul className="mt-4 space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                      <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" strokeWidth={3} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-3xl border border-ink-200/80 bg-ink-50/60 p-10 text-center dark:border-ink-800 dark:bg-ink-900/40">
            <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">See it in action</h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-500 dark:text-ink-400">Create your free account and explore every feature with realistic demo data.</p>
            <Link to="/register" className="mt-6 inline-block">
              <Button size="lg" className="px-6 py-3 text-base">Start Free Trial <Icon name="arrow-right" className="h-4 w-4" /></Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
