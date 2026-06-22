import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReportCatalog, getReport, exportReport } from '../services/reports.service.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { formatMoney } from '../utils/money.js';
import { useToast } from '../context/ToastContext.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

function Cell({ col, value, currency }) {
  if (value == null || value === '') return <span className="text-ink-300">—</span>;
  if (col.type === 'money') return <span className="tabular-nums">{formatMoney(value, currency)}</span>;
  if (col.type === 'date') return <span>{fmtDate(value)}</span>;
  if (col.type === 'number') return <span className="tabular-nums">{value}</span>;
  return <span>{value}</span>;
}

export default function Reports() {
  const toast = useToast();
  const [active, setActive] = useState('revenue');
  const [range, setRange] = useState({ from: '', to: '' });
  const [exporting, setExporting] = useState('');

  const { data: catalog = [] } = useQuery({ queryKey: ['report-catalog'], queryFn: getReportCatalog });
  const current = catalog.find((r) => r.key === active) || catalog[0];
  const params = current?.dateRange ? { from: range.from || undefined, to: range.to || undefined } : {};

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', active, params],
    queryFn: () => getReport(active, params),
    enabled: Boolean(active),
  });

  const onExport = async (format) => {
    setExporting(format);
    try {
      await exportReport(active, format, current?.dateRange ? { from: range.from, to: range.to } : {});
      toast.success(`${format.toUpperCase()} exported.`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting('');
    }
  };

  const alignRight = (c) => c.type === 'money' || c.type === 'number';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Analyse performance and export to CSV, Excel or PDF.</p>
      </div>

      {/* Report selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {catalog.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setActive(r.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active === r.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-300 dark:ring-ink-700 dark:hover:bg-ink-800'
            }`}
          >
            {r.title}
          </button>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            {current?.dateRange && (
              <>
                <label className="text-xs font-medium text-ink-500">
                  <span className="mb-1 block uppercase tracking-wide text-ink-400">From</span>
                  <input
                    type="date"
                    value={range.from}
                    onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                    className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm dark:border-ink-700 dark:bg-ink-800"
                  />
                </label>
                <label className="text-xs font-medium text-ink-500">
                  <span className="mb-1 block uppercase tracking-wide text-ink-400">To</span>
                  <input
                    type="date"
                    value={range.to}
                    onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                    className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm dark:border-ink-700 dark:bg-ink-800"
                  />
                </label>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" loading={exporting === 'csv'} onClick={() => onExport('csv')}>
              <Icon name="download" className="h-4 w-4" /> CSV
            </Button>
            <Button variant="secondary" size="sm" loading={exporting === 'xlsx'} onClick={() => onExport('xlsx')}>
              <Icon name="download" className="h-4 w-4" /> Excel
            </Button>
            <Button variant="secondary" size="sm" loading={exporting === 'pdf'} onClick={() => onExport('pdf')}>
              <Icon name="file-text" className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {isLoading || !report ? (
          <p className="py-12 text-center text-sm text-ink-400">Loading report…</p>
        ) : report.rows.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="bar-chart" className="mx-auto h-8 w-8 text-ink-300" />
            <p className="mt-2 text-sm text-ink-400">No data for this report yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-200 text-xs uppercase text-ink-500 dark:border-ink-800">
                <tr>
                  {report.columns.map((c) => (
                    <th key={c.key} className={`py-2 font-semibold ${alignRight(c) ? 'text-right' : ''}`}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {report.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40">
                    {report.columns.map((c) => (
                      <td key={c.key} className={`py-2.5 ${alignRight(c) ? 'text-right' : ''}`}>
                        <Cell col={c} value={row[c.key]} currency={report.currency} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {report.summary?.length > 0 && (
                <tfoot className="border-t-2 border-ink-200 font-semibold dark:border-ink-700">
                  {report.summary.map((row, i) => (
                    <tr key={i}>
                      {report.columns.map((c) => (
                        <td key={c.key} className={`py-2.5 ${alignRight(c) ? 'text-right' : ''}`}>
                          <Cell col={c} value={row[c.key]} currency={report.currency} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
