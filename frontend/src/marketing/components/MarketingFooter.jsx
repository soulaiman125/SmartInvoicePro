import { Link } from 'react-router-dom';
import BrandLogo from '../../components/brand/BrandLogo.jsx';
import Reveal from './Reveal.jsx';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', to: '/contact' },
      { label: 'Get started', to: '/register' },
      { label: 'Login', to: '/login' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Support', to: '/contact' },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-ink-200/70 bg-white dark:border-ink-800/70 dark:bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <Reveal className="col-span-2 md:col-span-2">
            <BrandLogo size={32} animate={false} tagline />
            <p className="mt-4 max-w-xs text-sm text-ink-500 dark:text-ink-400">
              Modern invoicing & business management for growing companies. Smart Billing. Better Business.
            </p>
          </Reveal>
          {COLUMNS.map((col, i) => (
            <Reveal key={col.title} delay={0.05 + i * 0.06} as="div">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-400">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-ink-500 transition-colors hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 text-sm text-ink-400 dark:border-ink-800 sm:flex-row">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} SmartInvoice Pro
            <span className="mx-1.5 hidden text-ink-300 sm:inline">·</span>
            <span className="block sm:inline">
              Developed by <span className="font-medium text-ink-500 dark:text-ink-300">Soulaiman El Boti</span>
            </span>
            <span className="mx-1.5 hidden text-ink-300 sm:inline">·</span>
            <span className="block sm:inline">All rights reserved</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
