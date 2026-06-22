import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import AnimatedCounter from '../../components/ui/AnimatedCounter.jsx';
import BrandMark from '../../components/brand/BrandMark.jsx';
import { useSEO } from '../useSEO.js';
import { FEATURES, TESTIMONIALS, COMPANIES } from '../content.js';
import Reveal from '../components/Reveal.jsx';
import Aurora from '../components/Aurora.jsx';
import FloatingMockup from '../components/FloatingMockup.jsx';
import PricingCards from '../components/PricingCards.jsx';
import FAQ from '../components/FAQ.jsx';
import { EASE } from '../../lib/animations.js';

const scrollToPreview = () => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });

const lineReveal = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.15 + i * 0.12 } }),
};

const HERO_CARDS = [
  { label: 'Revenue', value: '$69,196', pos: '-left-4 top-20 lg:-left-10', tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', icon: <Icon name="revenue" className="h-5 w-5" /> },
  { label: 'Invoice paid', value: 'INV-0015', pos: '-right-4 top-1/3 lg:-right-12', tone: 'bg-brand-500/15 text-brand-600 dark:text-brand-300', icon: <Icon name="check-circle" className="h-5 w-5" /> },
  { label: 'Low stock', value: '4 alerts', pos: '-left-4 bottom-14 lg:-left-12', tone: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', icon: <Icon name="alert" className="h-5 w-5" /> },
];

const STATS = [
  { value: 12000, format: (n) => `${Math.round(n / 1000)}k+`, label: 'Businesses' },
  { value: 480, format: (n) => `$${Math.round(n)}M`, label: 'Invoiced' },
  { value: 99.9, format: (n) => `${n.toFixed(1)}%`, label: 'Uptime' },
  { value: 4.9, format: (n) => `${n.toFixed(1)}/5`, label: 'Rating' },
];

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
      <Aurora />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-light bg-[size:34px_34px] opacity-[0.5] mask-fade-b dark:opacity-[0.08]" />

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-8 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200/70 bg-white/60 py-1 pl-1 pr-3 text-xs font-medium text-ink-600 shadow-xs backdrop-blur dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-300">
            <span className="flex items-center gap-1.5 rounded-full bg-brand-gradient px-2 py-0.5 text-white">
              <BrandMark size={14} animate={false} /> New
            </span>
            Premium PDFs, email delivery &amp; customer portal
          </span>
        </motion.div>

        <h1 className="text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl lg:text-6xl">
          <motion.span custom={0} variants={lineReveal} initial="hidden" animate="show" className="block">
            Modern Invoicing &amp; Business
          </motion.span>
          <motion.span custom={1} variants={lineReveal} initial="hidden" animate="show" className="block">
            Management for <span className="text-gradient">Growing Companies</span>
          </motion.span>
        </h1>

        <motion.p
          custom={2}
          variants={lineReveal}
          initial="hidden"
          animate="show"
          className="mx-auto mt-6 max-w-2xl text-lg text-ink-500 dark:text-ink-400"
        >
          Manage invoices, products, inventory, clients and payments from one powerful platform.
        </motion.p>

        <motion.div
          custom={3}
          variants={lineReveal}
          initial="hidden"
          animate="show"
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="group">
            <Link to="/register">
              <Button size="lg" className="px-6 py-3 text-base shadow-glow">
                Start Free Trial
                <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant="secondary" size="lg" className="px-6 py-3 text-base" onClick={scrollToPreview}>
              <Icon name="play" className="h-4 w-4" /> Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        <motion.p custom={4} variants={lineReveal} initial="hidden" animate="show" className="mt-4 text-xs text-ink-400">
          No credit card required · Free plan forever
        </motion.p>
      </div>

      {/* Floating dashboard mockup (real screenshot) */}
      <div className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
        <FloatingMockup eager cards={HERO_CARDS} />
      </div>

      {/* Stats */}
      <div className="mx-auto mt-20 max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <AnimatedCounter
                value={s.value}
                format={s.format}
                className="block text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl"
              />
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="border-y border-ink-200/60 bg-ink-50/50 py-10 dark:border-ink-800/60 dark:bg-ink-900/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          Trusted by 12,000+ growing businesses
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {COMPANIES.map((c, i) => (
            <Reveal key={c} delay={i * 0.05}>
              <span className="text-lg font-bold tracking-tight text-ink-400/70 transition-colors hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300">
                {c}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Everything in one place</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
          The complete toolkit to get paid faster
        </h2>
        <p className="mt-4 text-ink-500 dark:text-ink-400">
          Invoicing, quotes, inventory, clients, payments and analytics — beautifully designed and lightning fast.
        </p>
      </Reveal>
      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.07}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="group relative h-full overflow-hidden rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-900 dark:text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{f.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Showcase({ id, eyebrow, title, desc, points, reverse, mockup }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className={`grid items-center gap-12 lg:grid-cols-2 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">{title}</h2>
          <p className="mt-4 text-ink-500 dark:text-ink-400">{desc}</p>
          <ul className="mt-6 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-ink-200">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>{mockup}</Reveal>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="relative overflow-hidden py-24">
      <Aurora className="opacity-60" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            Loved by modern businesses
          </h2>
          <p className="mt-4 text-ink-500 dark:text-ink-400">Join thousands of teams who get paid faster with SmartInvoice Pro.</p>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="glass flex h-full flex-col rounded-2xl p-6 shadow-card">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Icon key={s} name="star" className="h-4 w-4" strokeWidth={0} fill="currentColor" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-700 dark:text-ink-200">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white">{t.initials}</span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-900 dark:text-white">{t.name}</span>
                    <span className="block text-xs text-ink-400">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-ink-500 dark:text-ink-400">Start free, upgrade as you grow. No hidden fees.</p>
      </Reveal>
      <div className="mt-12">
        <PricingCards />
      </div>
      <div className="mt-8 text-center">
        <Link to="/pricing" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Compare all features →
        </Link>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-16 text-center shadow-glow sm:px-12">
          <div className="absolute inset-0 bg-grid-light bg-[size:24px_24px] opacity-20" />
          <div className="absolute inset-0 bg-noise opacity-[0.06]" />
          <motion.div
            aria-hidden
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to get paid faster?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Start your free trial today. Set up in minutes — no credit card required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="group">
                <Link to="/register">
                  <Button variant="secondary" size="lg" className="px-6 py-3 text-base">
                    Start Free Trial <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </motion.div>
              <Link to="/contact">
                <Button variant="ghost" size="lg" className="px-6 py-3 text-base text-white hover:bg-white/10">
                  Talk to sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function Landing() {
  useSEO(
    'Modern Invoicing & Business Management',
    'Manage invoices, products, inventory, clients and payments from one powerful platform. Start free.',
  );
  return (
    <>
      <Hero />
      <TrustedBy />
      <FeaturesGrid />
      <Showcase
        id="showcase"
        eyebrow="Dashboard Analytics"
        title="Your business at a glance"
        desc="Real-time revenue trends, outstanding balances, top clients and products — beautiful, fast, and always up to date."
        points={['12-month revenue trends', 'Top clients & product performance', 'Live KPIs and cash flow']}
        mockup={
          <FloatingMockup
            url="app.smartinvoice.pro/dashboard"
            cards={[{ label: 'This month', value: '+18%', pos: '-right-4 -top-5 lg:-right-10', tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', icon: <Icon name="trending-up" className="h-5 w-5" /> }]}
          />
        }
      />
      <Showcase
        reverse
        eyebrow="Reports & Exports"
        title="Reports your accountant will love"
        desc="Revenue, client, product, outstanding and payment reports — filtered by date and exported to CSV, Excel or PDF in one click."
        points={['CSV · Excel · PDF export', 'Outstanding & aging reports', 'Date-range filtering']}
        mockup={
          <FloatingMockup
            url="app.smartinvoice.pro/reports"
            lightSrc="/screenshots/reports-light.png"
            darkSrc="/screenshots/reports-dark.png"
            alt="SmartInvoice Pro reports"
            cards={[{ label: 'Exported', value: 'revenue.xlsx', pos: '-left-4 bottom-8 lg:-left-12', tone: 'bg-brand-500/15 text-brand-600 dark:text-brand-300', icon: <Icon name="file-text" className="h-5 w-5" /> }]}
          />
        }
      />
      <Testimonials />
      <PricingPreview />
      <FAQ />
      <FinalCTA />
      <Reveal className="pb-10 pt-2 text-center">
        <p className="text-xs font-medium tracking-wide text-ink-400/80 dark:text-ink-500/80">
          Designed &amp; Developed by <span className="text-ink-500 dark:text-ink-300">Soulaiman El Boti</span>
        </p>
      </Reveal>
    </>
  );
}
