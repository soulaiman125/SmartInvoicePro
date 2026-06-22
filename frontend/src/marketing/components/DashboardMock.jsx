import Icon from '../../components/ui/Icon.jsx';

// High-fidelity recreation of the SmartInvoice Pro dashboard, built from the
// real design system so the marketing "screenshot" always matches the product
// and stays crisp + responsive in light and dark mode.

const REVENUE = [9.3, 6.1, 8.4, 7.6, 12.1, 9.2, 10.4, 8.1, 11.6, 14.3, 18.1, 21.7];

function AreaChart() {
  const w = 520;
  const h = 150;
  const max = Math.max(...REVENUE) * 1.15;
  const step = w / (REVENUE.length - 1);
  const pts = REVENUE.map((v, i) => [i * step, h - (v / max) * h]);
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mockArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3563e9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3563e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#mockArea)" />
      <path d={line} fill="none" stroke="#3563e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.5 : 0} fill="#3563e9" stroke="#fff" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

const KPIS = [
  { label: 'Total revenue', value: '$69,196', icon: 'revenue', tone: 'text-emerald-600 dark:text-emerald-400', trend: '+18%' },
  { label: 'Outstanding', value: '$122,190', icon: 'clock', tone: 'text-amber-600 dark:text-amber-400' },
  { label: 'Clients', value: '15', icon: 'clients', tone: 'text-brand-600 dark:text-brand-300' },
  { label: 'Invoices', value: '25', icon: 'invoices', tone: 'text-accent-600 dark:text-accent-400' },
];

const INVOICES = [
  ['INV-2026-0015', 'Apex Fitness Co.', '$4,820', 'paid'],
  ['INV-2026-0014', 'Harborview Consulting', '$12,400', 'sent'],
  ['INV-2026-0013', 'Nimbus Web Studio', '$3,150', 'overdue'],
  ['INV-2026-0012', 'Vertex Engineering', '$8,900', 'paid'],
];

const STATUS = {
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  sent: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  overdue: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

const PRODUCTS = [
  ['Training Workshop', 0.95],
  ['Data Migration', 0.62],
  ['App Dev Sprint', 0.55],
  ['Website Design', 0.5],
  ['UX Research', 0.33],
];

export default function DashboardMock() {
  return (
    <div className="grid grid-cols-12 gap-3 p-4 sm:p-5">
      {/* KPI row */}
      {KPIS.map((k) => (
        <div key={k.label} className="col-span-6 rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900 lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-ink-500">{k.label}</p>
            <Icon name={k.icon} className={`h-4 w-4 ${k.tone}`} />
          </div>
          <p className="mt-1 text-lg font-bold tracking-tight text-ink-900 dark:text-white">{k.value}</p>
          {k.trend && <p className="text-[10px] font-semibold text-emerald-500">{k.trend} vs last month</p>}
        </div>
      ))}

      {/* Revenue chart */}
      <div className="col-span-12 rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 lg:col-span-8">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">Revenue · last 12 months</p>
          <span className="text-[10px] font-medium text-ink-400">USD</span>
        </div>
        <div className="h-[150px]"><AreaChart /></div>
      </div>

      {/* Top products */}
      <div className="col-span-12 rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 lg:col-span-4">
        <p className="mb-3 text-xs font-semibold text-ink-700 dark:text-ink-200">Top products</p>
        <div className="space-y-2.5">
          {PRODUCTS.map(([name, pct]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between text-[10px] text-ink-500">
                <span className="truncate">{name}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="col-span-12 rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <p className="mb-2 text-xs font-semibold text-ink-700 dark:text-ink-200">Recent invoices</p>
        <div className="divide-y divide-ink-100 dark:divide-ink-800">
          {INVOICES.map(([num, client, amt, status]) => (
            <div key={num} className="flex items-center gap-3 py-2 text-xs">
              <span className="font-semibold text-brand-600 dark:text-brand-300">{num}</span>
              <span className="flex-1 truncate text-ink-500">{client}</span>
              <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">{amt}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS[status]}`}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
