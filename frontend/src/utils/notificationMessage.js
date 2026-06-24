import { formatMoney } from './money.js';

// Renders a human-readable message for an in-app notification.
export function notificationMessage(n) {
  const p = n.payload || {};
  switch (n.type) {
    case 'payment_received':
      return `Payment of ${formatMoney(p.amount, p.currency)} received${p.number ? ` for ${p.number}` : ''}`;
    case 'invoice_issued':
      return `Invoice ${p.number || ''} issued`;
    case 'low_stock':
      return `Low stock: ${p.name} (${p.stock} left)`;
    case 'invoice_overdue':
      return `Invoice ${p.number || ''} is overdue — ${formatMoney(p.balanceDue, p.currency)} due`;
    default:
      return n.type.replace(/_/g, ' ');
  }
}
