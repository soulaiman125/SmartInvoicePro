import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  useDashboard,
  useMonthlyRevenue,
  useProductPerformance,
  useClientReport,
} from '../hooks/useAnalytics.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { useTheme } from '../context/ThemeContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import AnimatedCounter from '../components/ui/AnimatedCounter.jsx';
import { DashboardSkeleton } from '../components/Skeleton.jsx';
import { notificationMessage } from '../utils/notificationMessage.js';
import { formatMoney } from '../utils/money.js';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const TONES = {
  brand: 'from-brand-500/15 to-brand-500/0 text-brand-600 dark:text-brand-300',
  emerald: 'from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-400',
  amber: 'from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-400',
  violet: 'from-accent-500/15 to-accent-500/0 text-accent-600 dark:text-accent-400',
  red: 'from-red-500/15 to-red-500/0 text-red-600 dark:text-red-400',
};

function KpiCard({ label, count = 0, format, icon, tone = 'brand', trend, to }) {
  const inner = (
    <Card
      hover
      className="relative overflow-hidden p-5"
    >
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-b ${TONES[tone]} blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink-900 tabular-nums dark:text-white">
            <AnimatedCounter value={count} format={format} />
          </p>
          {trend != null && (
            <p
              className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${
                trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              <Icon name={trend >= 0 ? 'trending-up' : 'trending-down'} className="h-3.5 w-3.5" />
              {trend >= 0 ? '+' : ''}{trend}%
              <span className="font-normal text-ink-400">vs last month</span>
            </p>
          )}
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b ${TONES[tone]} ring-1 ring-inset ring-ink-200/50 dark:ring-ink-700/50`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}

function MiniStat({ label, value, icon, alert }) {
  return (
    <Card hover className="flex items-center gap-3 p-4">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          alert
            ? 'bg-red-50 text-red-500 dark:bg-red-500/10'
            : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300'
        }`}
      >
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <div>
        <p className="text-lg font-bold tracking-tight tabular-nums">
          <AnimatedCounter value={value} />
        </p>
        <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
      </div>
    </Card>
  );
}

function Panel({ title, action, children, className = '' }) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  );
}

function ChartTooltip({ active, payload, label, prefix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ink-200 bg-white/95 px-3 py-2 text-xs shadow-popover backdrop-blur dark:border-ink-700 dark:bg-ink-900/95">
      {label && <p className="mb-0.5 font-medium text-ink-500">{label}</p>}
      <p className="font-semibold text-ink-900 tabular-nums dark:text-white">
        {prefix}
        {Number(payload[0].value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

function Onboarding({ counts }) {
  const steps = [
    { done: counts.clients > 0, label: 'Add your first client', to: '/clients' },
    { done: counts.products > 0, label: 'Add a product or service', to: '/products' },
    { done: counts.invoices > 0, label: 'Create your first invoice', to: '/invoices/new' },
  ];
  const done = steps.filter((s) => s.done).length;
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="relative overflow-hidden bg-brand-gradient p-6 text-white">
        <div className="absolute inset-0 bg-grid-light bg-[size:22px_22px] opacity-20" />
        <div className="relative">
          <h3 className="text-lg font-semibold">Welcome to SmartInvoice Pro 👋</h3>
          <p className="mt-1 text-sm text-white/80">Three quick steps to send your first invoice.</p>
          <div className="mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${(done / steps.length) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
      <ul className="divide-y divide-ink-100 dark:divide-ink-800">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center justify-between px-6 py-3">
            <span className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  s.done
                    ? 'bg-emerald-500 text-white'
                    : 'border border-ink-300 text-ink-400 dark:border-ink-600'
                }`}
              >
                {s.done && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />}
              </span>
              <span className={s.done ? 'text-ink-400 line-through' : 'font-medium'}>{s.label}</span>
            </span>
            {!s.done && (
              <Link to={s.to}>
                <Button size="sm" variant="secondary">Start</Button>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Dashboard() {
  const { theme } = useTheme();
  const { data, isLoading } = useDashboard();
  const { data: monthly = [] } = useMonthlyRevenue(12);
  const { data: performance = [] } = useProductPerformance(5);
  const { data: clientReport = [] } = useClientReport();
  const { data: activity } = useNotifications({ pageSize: 6 });

  if (isLoading || !data) return <DashboardSkeleton />;

  const c = data.counts;
  const isNew = c.clients === 0 && c.products === 0 && c.invoices === 0;
  const chartRevenue = monthly.map((m) => ({ month: m.month.slice(5), revenue: m.revenue / 100 }));
  const chartPerf = performance.map((p) => ({ name: p.name, revenue: p.revenue / 100 }));
  const topClients = clientReport.slice(0, 5);
  const events = activity?.data ?? [];

  // Derive a month-over-month revenue trend from the series we already have.
  let revenueTrend = null;
  if (monthly.length >= 2) {
    const prev = monthly[monthly.length - 2].revenue;
    const curr = monthly[monthly.length - 1].revenue;
    if (prev > 0) revenueTrend = Math.round(((curr - prev) / prev) * 100);
  }

  const axisColor = theme === 'dark' ? '#67768c' : '#8593a6';
  const barColor = theme === 'dark' ? '#598bff' : '#3563e9';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Your business at a glance.</p>
      </div>

      {isNew && <Onboarding counts={c} />}

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <KpiCard label="Total revenue" count={data.revenue} format={(n) => formatMoney(n)} icon="revenue" tone="emerald" trend={revenueTrend} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KpiCard label="Outstanding" count={data.outstanding} format={(n) => formatMoney(n)} icon="clock" tone="amber" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KpiCard label="Clients" count={c.clients} icon="clients" tone="brand" to="/clients" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KpiCard label="Invoices" count={c.invoices} icon="invoices" tone="violet" to="/invoices" />
        </motion.div>
      </motion.div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Products" value={c.products} icon="products" />
        <MiniStat label="Quotes" value={c.quotes} icon="quotes" />
        <MiniStat label="Paid invoices" value={(data.recentInvoices || []).filter((i) => i.status === 'paid').length} icon="check-circle" />
        <MiniStat label="Low-stock alerts" value={c.lowStockAlerts} icon="alert" alert={c.lowStockAlerts > 0} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Revenue · last 12 months"
            action={<span className="text-xs font-medium text-ink-400">USD</span>}
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartRevenue} margin={{ left: -8, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={barColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={barColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={axisColor} strokeOpacity={0.15} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} stroke={axisColor} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke={axisColor} width={48} />
                <Tooltip content={<ChartTooltip prefix="$" />} cursor={{ stroke: barColor, strokeOpacity: 0.3 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={barColor}
                  strokeWidth={2.5}
                  fill="url(#rev)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <Panel title="Top products">
          {chartPerf.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-400">No sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartPerf} layout="vertical" margin={{ left: 12, right: 8 }}>
                <CartesianGrid horizontal={false} stroke={axisColor} strokeOpacity={0.15} />
                <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} stroke={axisColor} />
                <YAxis type="category" dataKey="name" width={80} fontSize={11} tickLine={false} axisLine={false} stroke={axisColor} />
                <Tooltip content={<ChartTooltip prefix="$" />} cursor={{ fill: barColor, fillOpacity: 0.08 }} />
                <Bar dataKey="revenue" fill={barColor} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Recent invoices" action={<Link to="/invoices" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>}>
          {data.recentInvoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No invoices yet.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-ink-100 dark:divide-ink-800">
              {data.recentInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/50"
                  >
                    <span className="font-medium text-brand-600">{inv.number || 'Draft'}</span>
                    <span className="flex-1 truncate text-ink-500 dark:text-ink-400">{inv.client?.name}</span>
                    <span className="font-medium tabular-nums">{formatMoney(inv.total, inv.currency)}</span>
                    <StatusBadge status={inv.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top clients" action={<Link to="/clients" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>}>
          {topClients.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No billing data yet.</p>
          ) : (
            <ul className="space-y-1">
              {topClients.map((cl, i) => (
                <li key={cl.clientId} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate font-medium">{cl.name}</span>
                  <span className="font-medium tabular-nums text-ink-700 dark:text-ink-300">{formatMoney(cl.billed)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity">
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No activity yet.</p>
          ) : (
            <ul className="relative space-y-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-ink-200 dark:before:bg-ink-800">
              {events.map((e) => (
                <li key={e.id} className="relative flex gap-3 pl-0 text-sm">
                  <span className="relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-white bg-brand-500 shadow-sm dark:border-ink-900" />
                  <span className="min-w-0">
                    <span className="block text-ink-700 dark:text-ink-200">{notificationMessage(e)}</span>
                    <span className="text-xs text-ink-400">{new Date(e.createdAt).toLocaleString()}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
