import { useState } from 'react';
import { useMovements, useLowStock } from '../hooks/useInventory.js';
import { useProducts } from '../hooks/useProducts.js';
import StockAdjustModal from '../components/StockAdjustModal.jsx';
import Badge from '../components/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

const card = 'overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900';

const MOVEMENT_COLOR = { in: 'green', out: 'red', adjustment: 'amber' };

export default function Inventory() {
  const [adjusting, setAdjusting] = useState(false);
  const { data: lowStock = [] } = useLowStock();
  const { data: movements } = useMovements({ pageSize: 20 });
  const { data: productsPage } = useProducts({ pageSize: 100 });

  const tracked = (productsPage?.data ?? []).filter((p) => p.trackInventory);
  const logs = movements?.data ?? [];
  const nameById = new Map(tracked.map((p) => [p.id, p.name]));

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Track stock levels and movements.">
        <Button onClick={() => setAdjusting(true)}>
          <Icon name="inventory" className="h-4 w-4" /> Adjust stock
        </Button>
      </PageHeader>

      {lowStock.length > 0 && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <h3 className="mb-1 font-semibold text-red-700 dark:text-red-400">Low-stock alerts</h3>
            <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong> — {p.stockQuantity} left (threshold {p.lowStockThreshold})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={card}>
          <h3 className="border-b border-ink-200 px-5 py-3 text-sm font-semibold dark:border-ink-800">Tracked products</h3>
          {tracked.length === 0 ? (
            <p className="p-5 text-sm text-ink-400">No products are tracking inventory yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {tracked.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-ink-50/60 dark:hover:bg-ink-800/40">
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-right">
                      {p.stockQuantity <= p.lowStockThreshold ? (
                        <Badge color="red" dot>{p.stockQuantity} in stock</Badge>
                      ) : (
                        <span className="tabular-nums text-ink-600 dark:text-ink-300">{p.stockQuantity} in stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={card}>
          <h3 className="border-b border-ink-200 px-5 py-3 text-sm font-semibold dark:border-ink-800">Stock history</h3>
          {logs.length === 0 ? (
            <p className="p-5 text-sm text-ink-400">No stock movements recorded.</p>
          ) : (
            <ul className="divide-y divide-ink-100 text-sm dark:divide-ink-800">
              {logs.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="font-medium">{nameById.get(m.productId) || 'Product'}</span>
                    {m.reason && <span className="ml-2 text-xs text-ink-400">{m.reason}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={MOVEMENT_COLOR[m.type]}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </Badge>
                    <span className="tabular-nums text-ink-400">→ {m.resultingStock}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {adjusting && <StockAdjustModal products={tracked} onClose={() => setAdjusting(false)} />}
    </div>
  );
}
