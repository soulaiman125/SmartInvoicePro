import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon.jsx';
import Button from './Button.jsx';
import { exportToCsv, exportToExcel } from '../../utils/export.js';
import { EASE } from '../../lib/animations.js';

/**
 * Reusable premium table.
 * columns: [{ key, header, sortable?, align?, className?,
 *             render?(row), sortValue?(row), exportValue?(row), exportable? }]
 */
export default function DataTable({
  columns,
  rows,
  getRowId = (r) => r.id,
  onRowClick,
  selectable = false,
  bulkActions = [],
  exportName = 'export',
  toolbar = null,
  emptyState = null,
  loading = false,
  error = false,
}) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [selected, setSelected] = useState(() => new Set());
  const [hidden, setHidden] = useState(() => new Set());
  const [colMenu, setColMenu] = useState(false);

  // Reset selection whenever the underlying rows change (e.g. page change).
  const rowsKey = rows.map(getRowId).join(',');
  useEffect(() => setSelected(new Set()), [rowsKey]);

  const visibleColumns = columns.filter((c) => !hidden.has(c.key));

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const acc = col.sortValue || ((r) => r[col.key]);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map(getRowId)));
  const toggleRow = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const exportColumns = visibleColumns
    .filter((c) => c.exportable !== false)
    .map((c) => ({
      header: c.header,
      value: (r) => (c.exportValue ? c.exportValue(r) : r[c.key] ?? ''),
    }));
  const doExport = (fn) => fn(exportName, exportColumns, sortedRows);

  const colSpan = visibleColumns.length + (selectable ? 1 : 0);

  const checkboxCls =
    'h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600 focus:ring-brand-500/40 dark:border-ink-600 dark:bg-ink-800';

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">{toolbar}</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setColMenu((o) => !o)}>
              <Icon name="settings" className="h-4 w-4" /> Columns
            </Button>
            {colMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setColMenu(false)} />
                <div className="absolute right-0 z-20 mt-1.5 w-52 animate-scale-in rounded-xl border border-ink-200 bg-white p-2 shadow-popover dark:border-ink-800 dark:bg-ink-900">
                  {columns.map((c) => (
                    <label
                      key={c.key}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-50 dark:hover:bg-ink-800"
                    >
                      <input
                        type="checkbox"
                        className={checkboxCls}
                        checked={!hidden.has(c.key)}
                        onChange={() =>
                          setHidden((prev) => {
                            const next = new Set(prev);
                            next.has(c.key) ? next.delete(c.key) : next.add(c.key);
                            return next;
                          })
                        }
                      />
                      {c.header}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => doExport(exportToCsv)}>
            <Icon name="download" className="h-4 w-4" /> CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => doExport(exportToExcel)}>Excel</Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectable && selected.size > 0 && (
        <div className="mb-3 flex animate-slide-up items-center gap-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm shadow-glow-sm dark:border-brand-500/30 dark:bg-brand-500/10">
          <span className="font-semibold text-brand-700 dark:text-brand-300">{selected.size} selected</span>
          {bulkActions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => a.onClick([...selected], () => setSelected(new Set()))}
              className={`text-sm font-medium hover:underline ${a.variant === 'danger' ? 'text-red-600' : 'text-brand-600 dark:text-brand-300'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-200 bg-ink-50/70 text-xs uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-850/60 dark:text-ink-400">
              <tr>
                {selectable && (
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className={checkboxCls} checked={allSelected} onChange={toggleAll} aria-label="Select all rows" />
                  </th>
                )}
                {visibleColumns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-3 font-semibold ${c.align === 'right' ? 'text-right' : ''} ${c.sortable ? 'cursor-pointer select-none transition-colors hover:text-ink-700 dark:hover:text-ink-200' : ''}`}
                    onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                    aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className={`inline-flex items-center gap-1 ${c.align === 'right' ? 'justify-end' : ''}`}>
                      {c.header}
                      {c.sortable && (
                        <span className={`text-[10px] transition-opacity ${sort.key === c.key ? 'text-brand-600 opacity-100 dark:text-brand-400' : 'opacity-30'}`}>
                          {sort.key === c.key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/80">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {selectable && <td className="px-4 py-3.5"><div className="shimmer h-4 w-4 rounded bg-ink-100 dark:bg-ink-800" /></td>}
                    {visibleColumns.map((c) => (
                      <td key={c.key} className="px-4 py-3.5">
                        <div className={`shimmer h-4 rounded bg-ink-100 dark:bg-ink-800 ${c.align === 'right' ? 'ml-auto w-16' : 'w-24'}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-red-500">Failed to load.</td></tr>
              ) : sortedRows.length === 0 ? (
                <tr><td colSpan={colSpan} className="p-0">{emptyState}</td></tr>
              ) : (
                sortedRows.map((row, idx) => {
                  const id = getRowId(row);
                  const isSel = selected.has(id);
                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: EASE, delay: Math.min(idx * 0.035, 0.4) }}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-brand-50/40 dark:hover:bg-ink-800/40' : ''} ${isSel ? 'bg-brand-50/60 dark:bg-brand-500/10' : ''}`}
                    >
                      {selectable && (
                        <td className="w-10 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className={checkboxCls} checked={isSel} onChange={() => toggleRow(id)} aria-label="Select row" />
                        </td>
                      )}
                      {visibleColumns.map((c) => (
                        <td key={c.key} className={`px-4 py-3.5 ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.className || ''}`}>
                          {c.render ? c.render(row) : row[c.key]}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Standalone pagination control to pair with DataTable's server-side paging.
 */
export function Pagination({ page, totalPages, onPage, className = '' }) {
  if (totalPages <= 1) return null;
  return (
    <div className={`mt-4 flex items-center justify-between gap-2 text-sm text-ink-500 ${className}`}>
      <span className="text-xs text-ink-400">
        Page <span className="font-medium text-ink-600 dark:text-ink-300">{page}</span> of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <Icon name="chevron" className="h-4 w-4" /> Prev
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next <Icon name="chevron-right" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
