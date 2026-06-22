import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Icon from '../../components/ui/Icon.jsx';
import Button from '../../components/ui/Button.jsx';
import { PRICING } from '../content.js';
import Reveal from './Reveal.jsx';

const ANNUAL_DISCOUNT = 0.2; // 20% off when billed annually

function BillingSwitch({ billing, setBilling }) {
  const options = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'annual', label: 'Annual' },
  ];
  return (
    <div className="flex items-center justify-center gap-3">
      <LayoutGroup id="billing">
        <div className="relative inline-flex rounded-full border border-ink-200/80 bg-white/70 p-1 backdrop-blur dark:border-ink-700/80 dark:bg-ink-900/60">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setBilling(o.id)}
              className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                billing === o.id ? 'text-white' : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200'
              }`}
            >
              {billing === o.id && (
                <motion.span
                  layoutId="billing-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-full bg-brand-gradient shadow-glow-sm"
                />
              )}
              {o.label}
            </button>
          ))}
        </div>
      </LayoutGroup>
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        Save 20%
      </span>
    </div>
  );
}

function AnimatedPrice({ value }) {
  return (
    <span className="relative inline-flex h-12 items-end overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-bold tracking-tight text-ink-900 dark:text-white"
        >
          ${value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function PricingCards({ showSwitch = true }) {
  const [billing, setBilling] = useState('monthly');
  const priceFor = (tier) => {
    if (!tier.price) return 0;
    return billing === 'annual' ? Math.round(tier.price * (1 - ANNUAL_DISCOUNT)) : tier.price;
  };

  return (
    <div>
      {showSwitch && (
        <Reveal className="mb-10">
          <BillingSwitch billing={billing} setBilling={setBilling} />
        </Reveal>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PRICING.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className={`relative flex h-full flex-col rounded-2xl border p-6 ${
                tier.highlight
                  ? 'border-brand-500/60 bg-white shadow-glow dark:bg-ink-900'
                  : 'border-ink-200/80 bg-white shadow-card hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white shadow-glow-sm">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-ink-900 dark:text-white">{tier.name}</h3>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{tier.tagline}</p>
              <div className="mt-5 flex items-end gap-1.5">
                <AnimatedPrice value={priceFor(tier)} />
                <span className="mb-1.5 text-sm text-ink-400">
                  {tier.price ? `/mo${billing === 'annual' ? ' billed yearly' : ''}` : `/${tier.cadence}`}
                </span>
              </div>
              <Link to="/register" className="mt-5 block">
                <Button variant={tier.highlight ? 'primary' : 'secondary'} size="lg" className="w-full">
                  {tier.cta}
                </Button>
              </Link>
              <ul className="mt-6 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-600 dark:text-ink-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
