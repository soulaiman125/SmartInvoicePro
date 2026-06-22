// Professional, responsive HTML email templates for SmartInvoice Pro.
// Inline styles only (email clients strip <style>), table-based layout for
// maximum compatibility (Outlook, Gmail, Apple Mail, mobile).

const BRAND = '#4F46E5';
const INK = '#0f172a';
const MUTED = '#64748b';
const BG = '#f1f5f9';
const LINE = '#e2e8f0';

const money = (minor, currency = 'USD') => {
  const v = Number(minor || 0) / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);
  } catch {
    return `${currency} ${v.toFixed(2)}`;
  }
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Shared shell: brand header + card + footer.
function layout({ org, heading, intro, bodyHtml = '', cta }) {
  const orgName = esc(org?.name || 'SmartInvoice Pro');
  const ctaHtml = cta
    ? `<tr><td style="padding:8px 0 4px;">
         <a href="${esc(cta.url)}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;">${esc(cta.label)}</a>
       </td></tr>`
    : '';
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:${BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">
        <tr><td style="background:${BRAND};background:linear-gradient(135deg,${BRAND},#6366f1);padding:22px 28px;">
          <table role="presentation" width="100%"><tr>
            <td style="vertical-align:middle;">
              <span style="display:inline-block;width:34px;height:34px;background:#fff;border-radius:9px;color:${BRAND};font-weight:700;font-family:Arial,Helvetica,sans-serif;font-size:18px;text-align:center;line-height:34px;">S</span>
              <span style="color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;margin-left:10px;vertical-align:middle;">${orgName}</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:30px 28px 8px;">
          <h1 style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:21px;color:${INK};">${esc(heading)}</h1>
          ${intro ? `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${MUTED};">${intro}</p>` : ''}
        </td></tr>
        <tr><td style="padding:0 28px 8px;"><table role="presentation" width="100%">${bodyHtml}${ctaHtml}</table></td></tr>
        <tr><td style="padding:18px 28px 26px;">
          <hr style="border:none;border-top:1px solid ${LINE};margin:8px 0 14px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#94a3b8;">
            This email was sent by ${orgName} via SmartInvoice Pro.<br>
            If you have questions, simply reply to this message.
          </p>
        </td></tr>
      </table>
      <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#94a3b8;">Powered by SmartInvoice Pro</p>
    </td></tr>
  </table>
</body></html>`;
}

// A compact summary table (label / value rows).
function summaryRows(rows) {
  return rows
    .map(
      ([label, value, strong]) =>
        `<tr>
          <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};">${esc(label)}</td>
          <td align="right" style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:${strong ? '16px' : '13px'};font-weight:${strong ? '700' : '400'};color:${INK};">${esc(value)}</td>
        </tr>`,
    )
    .join('');
}

function box(innerHtml) {
  return `<tr><td style="padding:4px 0 16px;">
    <table role="presentation" width="100%" style="background:#f8fafc;border:1px solid ${LINE};border-radius:12px;">
      <tr><td style="padding:14px 16px;"><table role="presentation" width="100%">${innerHtml}</table></td></tr>
    </table></td></tr>`;
}

// ---- Per-type renderers -----------------------------------------------------

export function invoiceEmail({ org, invoice, client, url }) {
  const c = invoice.currency;
  const body =
    box(
      summaryRows([
        ['Invoice', invoice.number || 'Draft'],
        ['Issue date', fmtDate(invoice.issueDate)],
        ['Due date', fmtDate(invoice.dueDate)],
        ['Amount due', money(invoice.balanceDue ?? invoice.total, c), true],
      ]),
    ) + (url ? '' : '');
  return {
    subject: `Invoice ${invoice.number || ''} from ${org?.name || 'SmartInvoice Pro'}`.trim(),
    html: layout({
      org,
      heading: `Invoice ${invoice.number || ''}`.trim(),
      intro: `Hi ${esc(client?.name || 'there')}, please find your invoice attached as a PDF. A summary is below.`,
      bodyHtml: body,
      cta: url ? { label: 'View invoice online', url } : null,
    }),
    text: `Invoice ${invoice.number || ''} from ${org?.name}. Amount due: ${money(invoice.balanceDue ?? invoice.total, c)}, due ${fmtDate(invoice.dueDate)}.${url ? ` View online: ${url}` : ''}`,
  };
}

export function quoteEmail({ org, quote, client, url }) {
  const c = quote.currency;
  return {
    subject: `Quotation ${quote.number || ''} from ${org?.name || 'SmartInvoice Pro'}`.trim(),
    html: layout({
      org,
      heading: `Quotation ${quote.number || ''}`.trim(),
      intro: `Hi ${esc(client?.name || 'there')}, thank you for your interest. Your quotation is attached as a PDF.`,
      bodyHtml: box(
        summaryRows([
          ['Quotation', quote.number || 'Draft'],
          ['Issue date', fmtDate(quote.issueDate)],
          ['Valid until', fmtDate(quote.validUntil)],
          ['Total', money(quote.total, c), true],
        ]),
      ),
      cta: url ? { label: 'Review & accept quote', url } : null,
    }),
    text: `Quotation ${quote.number || ''} from ${org?.name}. Total: ${money(quote.total, c)}, valid until ${fmtDate(quote.validUntil)}.${url ? ` Review online: ${url}` : ''}`,
  };
}

export function paymentReminderEmail({ org, invoice, client, url }) {
  const c = invoice.currency;
  const overdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();
  return {
    subject: `${overdue ? 'Overdue: ' : 'Reminder: '}Invoice ${invoice.number || ''}`.trim(),
    html: layout({
      org,
      heading: overdue ? 'Payment overdue' : 'Friendly payment reminder',
      intro: `Hi ${esc(client?.name || 'there')}, this is a ${overdue ? 'notice that your invoice is now overdue' : 'reminder that your invoice is due soon'}. The invoice is attached for your convenience.`,
      bodyHtml: box(
        summaryRows([
          ['Invoice', invoice.number || ''],
          ['Due date', fmtDate(invoice.dueDate)],
          ['Balance due', money(invoice.balanceDue ?? invoice.total, c), true],
        ]),
      ),
      cta: url ? { label: 'View & pay invoice', url } : null,
    }),
    text: `Reminder: invoice ${invoice.number || ''} balance ${money(invoice.balanceDue ?? invoice.total, c)} is due ${fmtDate(invoice.dueDate)}.${url ? ` Pay online: ${url}` : ''}`,
  };
}

export function invoicePaidEmail({ org, invoice, client, amount }) {
  const c = invoice.currency;
  return {
    subject: `Payment received — Invoice ${invoice.number || ''}`.trim(),
    html: layout({
      org,
      heading: 'Payment received — thank you!',
      intro: `Hi ${esc(client?.name || 'there')}, we've received your payment for invoice ${esc(invoice.number || '')}. Thank you for your business.`,
      bodyHtml: box(
        summaryRows([
          ['Invoice', invoice.number || ''],
          ['Amount received', money(amount ?? invoice.amountPaid, c), true],
          ['Remaining balance', money(invoice.balanceDue, c)],
        ]),
      ),
    }),
    text: `Payment of ${money(amount ?? invoice.amountPaid, c)} received for invoice ${invoice.number || ''}. Thank you!`,
  };
}

export function welcomeEmail({ org, name, url }) {
  return {
    subject: `Welcome to ${org?.name || 'SmartInvoice Pro'} 🎉`,
    html: layout({
      org,
      heading: `Welcome${name ? `, ${esc(name)}` : ''}!`,
      intro: `Your ${esc(org?.name || 'SmartInvoice Pro')} workspace is ready. Create polished invoices, send quotes, track payments and get paid faster.`,
      bodyHtml: box(
        `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};line-height:1.7;">
          ✓ Add your clients and products<br>
          ✓ Create and send your first invoice<br>
          ✓ Share a secure portal link with customers
        </td></tr>`,
      ),
      cta: url ? { label: 'Open your dashboard', url } : null,
    }),
    text: `Welcome to ${org?.name || 'SmartInvoice Pro'}! Your workspace is ready.${url ? ` Open: ${url}` : ''}`,
  };
}
