import PDFDocument from 'pdfkit';
import qrImage from 'qr-image';
import { env } from '../config/env.js';

// ─────────────────────────────────────────────────────────────────────────────
// SmartInvoice Pro — Premium PDF engine
//
// A small layout framework on top of PDFKit that renders enterprise-grade
// invoices and quotations. Two templates are available:
//   • modern  — branded colour header band, zebra-striped table (default)
//   • classic — traditional ruled layout, serif typography, monochrome
//
// Public API is unchanged and backward compatible:
//   buildInvoicePdf(invoice, org, options?) -> PDFDocument
//   buildQuotePdf(quote,   org, options?)   -> PDFDocument
// `options.template` selects the template ('modern' | 'classic').
// ─────────────────────────────────────────────────────────────────────────────

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 50;
const LEFT = MARGIN;
const RIGHT = PAGE.width - MARGIN; // 545.28
const CONTENT_W = RIGHT - LEFT;
const FOOTER_TOP = PAGE.height - 64;
const BODY_BOTTOM = FOOTER_TOP - 16;

// ---- Themes ----------------------------------------------------------------

const TEMPLATES = {
  modern: {
    accent: '#4F46E5', // indigo — matches the SmartInvoice Pro brand
    accentSoft: '#EEF0FE',
    ink: '#0F172A',
    muted: '#64748B',
    line: '#E2E8F0',
    zebra: '#F8FAFC',
    headerBand: true,
    zebraRows: true,
    fonts: { regular: 'Helvetica', bold: 'Helvetica-Bold', italic: 'Helvetica-Oblique' },
  },
  classic: {
    accent: '#1F2937',
    accentSoft: '#F3F4F6',
    ink: '#111827',
    muted: '#6B7280',
    line: '#D1D5DB',
    zebra: '#FAFAFA',
    headerBand: false,
    zebraRows: false,
    fonts: { regular: 'Times-Roman', bold: 'Times-Bold', italic: 'Times-Italic' },
  },
};

// Coloured pills for document status.
const STATUS_COLORS = {
  draft: ['#64748B', '#F1F5F9'],
  sent: ['#2563EB', '#EFF6FF'],
  viewed: ['#7C3AED', '#F5F3FF'],
  partially_paid: ['#D97706', '#FFFBEB'],
  paid: ['#059669', '#ECFDF5'],
  overdue: ['#DC2626', '#FEF2F2'],
  cancelled: ['#6B7280', '#F3F4F6'],
  accepted: ['#059669', '#ECFDF5'],
  declined: ['#DC2626', '#FEF2F2'],
  expired: ['#6B7280', '#F3F4F6'],
};

// ---- Formatting helpers ----------------------------------------------------

function money(minor, currency = 'USD') {
  const value = Number(minor || 0) / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

function addressLines(address) {
  if (!address || typeof address !== 'object') return [];
  return [
    address.line1,
    address.line2,
    [address.postalCode, address.city, address.state].filter(Boolean).join(', '),
    address.country || address.countryCode,
  ].filter(Boolean);
}

const titleCase = (s) =>
  String(s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

// ---- Drawing primitives ----------------------------------------------------

// Branded monogram used when no logo image is available.
function drawMonogram(doc, t, x, y, size, onDark) {
  doc.roundedRect(x, y, size, size, size * 0.26).fill(onDark ? '#FFFFFF' : t.accent);
  doc
    .fillColor(onDark ? t.accent : '#FFFFFF')
    .font(t.fonts.bold)
    .fontSize(size * 0.5)
    .text('S', x, y + size * 0.24, { width: size, align: 'center' });
}

// Try to embed an org logo (data URI or absolute file path). Falls back to the
// monogram. Returns true if an image was drawn.
function tryDrawLogo(doc, org, x, y, maxW, maxH) {
  const url = org?.logoUrl;
  if (!url) return false;
  try {
    let img = url;
    if (typeof url === 'string' && url.startsWith('data:')) {
      img = Buffer.from(url.split(',')[1], 'base64');
    } else if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      return false; // remote fetch not supported synchronously — use monogram
    }
    doc.image(img, x, y, { fit: [maxW, maxH], align: 'left', valign: 'center' });
    return true;
  } catch {
    return false;
  }
}

function statusBadge(doc, t, status, x, y, align = 'left') {
  const label = titleCase(status || 'draft');
  const [fg, bg] = STATUS_COLORS[status] || STATUS_COLORS.draft;
  doc.font(t.fonts.bold).fontSize(8.5);
  const tw = doc.widthOfString(label.toUpperCase());
  const padX = 9;
  const w = tw + padX * 2;
  const h = 18;
  const bx = align === 'right' ? x - w : x;
  doc.roundedRect(bx, y, w, h, 9).fill(bg);
  doc
    .fillColor(fg)
    .text(label.toUpperCase(), bx, y + 5, { width: w, align: 'center', characterSpacing: 0.5 });
  return { width: w, height: h, x: bx };
}

// Diagonal status stamp (PAID / OVERDUE / CANCELLED) for visual signalling.
function drawStamp(doc, t, status) {
  const stamps = {
    paid: ['PAID', '#059669'],
    overdue: ['OVERDUE', '#DC2626'],
    cancelled: ['CANCELLED', '#9CA3AF'],
  };
  const stamp = stamps[status];
  if (!stamp) return;
  const [text, color] = stamp;
  doc.save();
  doc.rotate(-18, { origin: [PAGE.width / 2, 360] });
  doc.opacity(0.08);
  doc
    .font('Helvetica-Bold')
    .fontSize(110)
    .fillColor(color)
    .text(text, 0, 300, { width: PAGE.width, align: 'center' });
  doc.opacity(1);
  doc.restore();
}

// ---- Header ----------------------------------------------------------------

function drawHeader(doc, t, { title, number, org, status }) {
  if (t.headerBand) {
    // Gradient brand band across the top of the page.
    const grad = doc.linearGradient(0, 0, PAGE.width, 132);
    grad.stop(0, t.accent).stop(1, '#6366F1');
    doc.rect(0, 0, PAGE.width, 132).fill(grad);

    const logoDrawn = tryDrawLogo(doc, org, LEFT, 34, 130, 44);
    let tx = LEFT;
    if (!logoDrawn) {
      drawMonogram(doc, t, LEFT, 36, 40, true);
      tx = LEFT + 52;
    }
    doc.fillColor('#FFFFFF').font(t.fonts.bold).fontSize(17).text(org?.name || 'SmartInvoice Pro', tx, 40);
    doc.font(t.fonts.regular).fontSize(9).fillColor('#E0E7FF');
    let y = 62;
    if (org?.legalTaxId) {
      doc.text(`Tax ID: ${org.legalTaxId}`, tx, y);
      y += 12;
    }
    for (const line of addressLines(org?.address)) {
      doc.text(line, tx, y, { width: 220 });
      y += 12;
    }

    // Right side: title + number + status badge.
    doc.fillColor('#FFFFFF').font(t.fonts.bold).fontSize(28).text(title, RIGHT - 230, 38, { width: 230, align: 'right' });
    doc.font(t.fonts.regular).fontSize(11).fillColor('#E0E7FF').text(number || 'DRAFT', RIGHT - 230, 74, { width: 230, align: 'right' });
    statusBadge(doc, t, status, RIGHT, 92, 'right');
    return 168;
  }

  // Classic: centred wordmark + ruled title.
  doc.fillColor(t.ink).font(t.fonts.bold).fontSize(20).text(org?.name || 'SmartInvoice Pro', LEFT, 48);
  doc.font(t.fonts.regular).fontSize(9).fillColor(t.muted);
  let y = 74;
  if (org?.legalTaxId) {
    doc.text(`Tax ID: ${org.legalTaxId}`, LEFT, y);
    y += 12;
  }
  for (const line of addressLines(org?.address)) {
    doc.text(line, LEFT, y);
    y += 12;
  }
  doc.fillColor(t.ink).font(t.fonts.bold).fontSize(24).text(title, RIGHT - 230, 48, { width: 230, align: 'right' });
  doc.font(t.fonts.regular).fontSize(11).fillColor(t.muted).text(number || 'DRAFT', RIGHT - 230, 78, { width: 230, align: 'right' });
  statusBadge(doc, t, status, RIGHT, 96, 'right');
  const top = Math.max(y, 116) + 8;
  doc.moveTo(LEFT, top).lineTo(RIGHT, top).lineWidth(1.5).strokeColor(t.accent).stroke();
  return top + 18;
}

// "Billed To" + meta column.
function drawParties(doc, t, startY, { client, meta }) {
  let y = startY;
  // Billed-to card.
  doc.fillColor(t.muted).font(t.fonts.bold).fontSize(8.5).text('BILLED TO', LEFT, y, { characterSpacing: 0.8 });
  doc.fillColor(t.ink).font(t.fonts.bold).fontSize(12).text(client?.name || '—', LEFT, y + 14, { width: 250 });
  doc.font(t.fonts.regular).fontSize(9.5).fillColor(t.muted);
  let cy = y + 30;
  const lines = [client?.email, client?.taxId ? `Tax ID: ${client.taxId}` : null, ...addressLines(client?.billingAddress)].filter(Boolean);
  for (const line of lines) {
    doc.text(line, LEFT, cy, { width: 250 });
    cy += 13;
  }

  // Meta column (right) — boxed key/value rows.
  const boxX = 330;
  const boxW = RIGHT - boxX;
  let my = y;
  for (const [label, value, strong] of meta) {
    doc.fillColor(t.muted).font(t.fonts.regular).fontSize(9).text(label, boxX, my, { width: boxW * 0.5 });
    doc
      .fillColor(strong ? t.accent : t.ink)
      .font(strong ? t.fonts.bold : t.fonts.regular)
      .fontSize(strong ? 11 : 9.5)
      .text(value, boxX + boxW * 0.42, my - (strong ? 1 : 0), { width: boxW * 0.58, align: 'right' });
    my += strong ? 18 : 15;
  }

  return Math.max(cy, my) + 18;
}

// ---- Items table (with page breaks) ---------------------------------------

const COLS = {
  desc: { x: LEFT, w: 232 },
  qty: { x: LEFT + 238, w: 44, align: 'right' },
  price: { x: LEFT + 286, w: 78, align: 'right' },
  tax: { x: LEFT + 368, w: 44, align: 'right' },
  amount: { x: LEFT + 416, w: CONTENT_W - 416, align: 'right' },
};

function drawTableHeader(doc, t, y) {
  doc.roundedRect(LEFT, y, CONTENT_W, 24, 4).fill(t.accentSoft);
  doc.fillColor(t.accent).font(t.fonts.bold).fontSize(8.5);
  const ty = y + 8;
  doc.text('DESCRIPTION', COLS.desc.x + 8, ty, { width: COLS.desc.w });
  doc.text('QTY', COLS.qty.x, ty, { width: COLS.qty.w, align: 'right' });
  doc.text('UNIT PRICE', COLS.price.x, ty, { width: COLS.price.w, align: 'right' });
  doc.text('TAX', COLS.tax.x, ty, { width: COLS.tax.w, align: 'right' });
  doc.text('AMOUNT', COLS.amount.x, ty, { width: COLS.amount.w - 8, align: 'right' });
  return y + 24 + 4;
}

function drawItems(doc, t, startY, items, currency, onNewPage) {
  let y = drawTableHeader(doc, t, startY);
  doc.font(t.fonts.regular).fontSize(9.5);

  items.forEach((it, i) => {
    const descH = doc.heightOfString(it.description || '', { width: COLS.desc.w - 8 });
    const rowH = Math.max(descH + 12, 24);

    // Page break before drawing a row that would overflow the body area.
    if (y + rowH > BODY_BOTTOM) {
      doc.addPage();
      onNewPage();
      y = drawTableHeader(doc, t, MARGIN + 20);
      doc.font(t.fonts.regular).fontSize(9.5);
    }

    if (t.zebraRows && i % 2 === 1) {
      doc.rect(LEFT, y - 2, CONTENT_W, rowH).fill(t.zebra);
    }

    const cellY = y + 4;
    const taxPct = it.taxRateBasisPoints ? `${(it.taxRateBasisPoints / 100).toFixed(it.taxRateBasisPoints % 100 ? 2 : 0)}%` : '—';
    doc.fillColor(t.ink).font(t.fonts.regular).fontSize(9.5);
    doc.text(it.description || '', COLS.desc.x + 8, cellY, { width: COLS.desc.w - 8 });
    doc.fillColor(t.muted);
    doc.text(String(Number(it.quantity)), COLS.qty.x, cellY, { width: COLS.qty.w, align: 'right' });
    doc.text(money(it.unitPrice, currency), COLS.price.x, cellY, { width: COLS.price.w, align: 'right' });
    doc.text(taxPct, COLS.tax.x, cellY, { width: COLS.tax.w, align: 'right' });
    doc.fillColor(t.ink).font(t.fonts.bold).text(money(it.lineTotal, currency), COLS.amount.x, cellY, { width: COLS.amount.w - 8, align: 'right' });

    y += rowH;
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).lineWidth(0.5).strokeColor(t.line).stroke();
  });

  return y + 8;
}

// ---- Summary (tax breakdown + totals + payment summary) --------------------

function drawSummary(doc, t, startY, rows, onNewPage) {
  // Keep the summary block together; push to a new page if it won't fit.
  const needed = rows.length * 18 + 24;
  let y = startY;
  if (y + needed > BODY_BOTTOM) {
    doc.addPage();
    onNewPage();
    y = MARGIN + 20;
  }

  const boxX = 320;
  const boxW = RIGHT - boxX;
  for (const [label, value, kind] of rows) {
    if (kind === 'rule') {
      doc.moveTo(boxX, y + 2).lineTo(RIGHT, y + 2).lineWidth(1).strokeColor(t.line).stroke();
      y += 8;
      continue;
    }
    const strong = kind === 'total' || kind === 'due';
    if (kind === 'total' || kind === 'due') {
      doc.roundedRect(boxX, y - 4, boxW, 24, 4).fill(kind === 'total' ? t.accentSoft : '#F8FAFC');
    }
    doc
      .fillColor(strong ? t.accent : t.muted)
      .font(strong ? t.fonts.bold : t.fonts.regular)
      .fontSize(strong ? 11 : 9.5)
      .text(label, boxX + 8, y + (strong ? 1 : 0), { width: boxW * 0.5 });
    doc
      .fillColor(strong ? t.ink : t.ink)
      .font(strong ? t.fonts.bold : t.fonts.regular)
      .fontSize(strong ? 12 : 9.5)
      .text(value, boxX + boxW * 0.4, y + (strong ? 0 : 0), { width: boxW * 0.6 - 8, align: 'right' });
    y += strong ? 26 : 16;
  }
  return y + 6;
}

// ---- Notes / terms / acceptance -------------------------------------------

function drawNotes(doc, t, y, { title, body }) {
  if (!body) return y;
  doc.fillColor(t.muted).font(t.fonts.bold).fontSize(8.5).text(title, LEFT, y, { characterSpacing: 0.6 });
  doc.fillColor(t.ink).font(t.fonts.regular).fontSize(9.5).text(body, LEFT, y + 14, { width: 250 });
  return y + 14 + doc.heightOfString(body, { width: 250 }) + 10;
}

// Bottom-left QR code that links to the online invoice (or encodes its key
// details when no app URL is configured). Non-critical: skipped on any error.
function drawInvoiceQr(doc, t, invoice) {
  try {
    const payload = env.appUrl
      ? `${env.appUrl}/invoices/${invoice.id}`
      : `INVOICE ${invoice.number || ''} · ${money(invoice.total, invoice.currency)} · due ${fmtDate(invoice.dueDate)}`;
    const png = qrImage.imageSync(payload, { type: 'png', margin: 1, ec_level: 'M' });
    const size = 60;
    const qy = FOOTER_TOP - size - 24;
    doc.image(png, LEFT, qy, { width: size, height: size });
    doc.fillColor(t.muted).font(t.fonts.regular).fontSize(7.5)
      .text('Scan to view invoice', LEFT, qy + size + 4, { width: size + 36 });
  } catch {
    /* QR is a nice-to-have; never block PDF generation on it */
  }
}

function drawAcceptance(doc, t, y) {
  doc.fillColor(t.muted).font(t.fonts.bold).fontSize(8.5).text('ACCEPTANCE', LEFT, y, { characterSpacing: 0.6 });
  doc.fillColor(t.ink).font(t.fonts.regular).fontSize(9).text(
    'By signing below, the client agrees to the scope, pricing and terms set out in this quotation.',
    LEFT,
    y + 14,
    { width: CONTENT_W },
  );
  const sy = y + 56;
  const colW = (CONTENT_W - 30) / 2;
  doc.moveTo(LEFT, sy).lineTo(LEFT + colW, sy).lineWidth(0.8).strokeColor(t.line).stroke();
  doc.moveTo(LEFT + colW + 30, sy).lineTo(RIGHT, sy).stroke();
  doc.fillColor(t.muted).font(t.fonts.regular).fontSize(8.5);
  doc.text('Authorised signature', LEFT, sy + 4);
  doc.text('Date', LEFT + colW + 30, sy + 4);
  return sy + 22;
}

// ---- Footer (rendered on every page after layout) --------------------------

function drawFooters(doc, t, org, footerText) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    doc.moveTo(LEFT, FOOTER_TOP).lineTo(RIGHT, FOOTER_TOP).lineWidth(0.5).strokeColor(t.line).stroke();
    doc.font(t.fonts.regular).fontSize(8).fillColor(t.muted);
    doc.text(footerText || `${org?.name || 'SmartInvoice Pro'} · Thank you for your business`, LEFT, FOOTER_TOP + 8, { width: CONTENT_W * 0.6 });
    doc.text(`Page ${i + 1} of ${range.count}`, RIGHT - 120, FOOTER_TOP + 8, { width: 120, align: 'right' });
    doc
      .fillColor('#9CA3AF')
      .fontSize(7.5)
      .text('Generated by SmartInvoice Pro', LEFT, FOOTER_TOP + 22, { width: CONTENT_W, align: 'center' });
  }
}

// ---- Public builders -------------------------------------------------------

function newDoc() {
  return new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
}

function resolveTheme(options) {
  const name = options?.template && TEMPLATES[options.template] ? options.template : 'modern';
  const base = TEMPLATES[name];
  // Allow per-org brand colour override (org.settings.brandColor) for the modern band.
  const brand = options?.brandColor;
  return brand ? { ...base, accent: brand } : base;
}

export function buildInvoicePdf(invoice, org, options = {}) {
  const t = resolveTheme({ ...options, brandColor: org?.settings?.brandColor });
  const doc = newDoc();
  const c = invoice.currency;
  const footer = org?.settings?.invoiceFooter || invoice.footer;

  const render = () => {};
  drawStamp(doc, t, invoice.status);
  let y = drawHeader(doc, t, { title: 'INVOICE', number: invoice.number, org, status: invoice.status });
  y = drawParties(doc, t, y, {
    client: invoice.client,
    meta: [
      ['Invoice No.', invoice.number || 'DRAFT'],
      ['Issue date', fmtDate(invoice.issueDate)],
      ['Due date', fmtDate(invoice.dueDate)],
      ['Currency', c],
      ['Amount due', money(invoice.balanceDue, c), true],
    ],
  });
  y = drawItems(doc, t, y, invoice.items, c, render);

  const summaryRows = [
    ['Subtotal', money(invoice.subtotal, c)],
    ...(Number(invoice.discountTotal) ? [['Discount', `−${money(invoice.discountTotal, c)}`]] : []),
    ['Tax', money(invoice.taxTotal, c)],
    ['', '', 'rule'],
    ['Total', money(invoice.total, c), 'total'],
    ['Amount paid', `−${money(invoice.amountPaid, c)}`],
    ['Balance due', money(invoice.balanceDue, c), 'due'],
  ];
  const afterSummary = drawSummary(doc, t, y, summaryRows, render);

  if (invoice.notes) drawNotes(doc, t, afterSummary, { title: 'NOTES', body: invoice.notes });

  drawInvoiceQr(doc, t, invoice);
  drawFooters(doc, t, org, footer);
  return doc;
}

export function buildQuotePdf(quote, org, options = {}) {
  const t = resolveTheme({ ...options, brandColor: org?.settings?.brandColor });
  const doc = newDoc();
  const c = quote.currency;
  const render = () => {};

  drawStamp(doc, t, quote.status);
  let y = drawHeader(doc, t, { title: 'QUOTATION', number: quote.number, org, status: quote.status });
  y = drawParties(doc, t, y, {
    client: quote.client,
    meta: [
      ['Quote No.', quote.number || 'DRAFT'],
      ['Issue date', fmtDate(quote.issueDate)],
      ['Valid until', fmtDate(quote.validUntil), true],
      ['Currency', c],
    ],
  });
  y = drawItems(doc, t, y, quote.items, c, render);

  const afterSummary = drawSummary(doc, t, y, [
    ['Subtotal', money(quote.subtotal, c)],
    ['Tax', money(quote.taxTotal, c)],
    ['', '', 'rule'],
    ['Total', money(quote.total, c), 'total'],
  ], render);

  let ny = afterSummary;
  ny = drawNotes(doc, t, ny, {
    title: 'VALIDITY',
    body: `This quotation is valid until ${fmtDate(quote.validUntil)}. Prices and availability are subject to change after this date.`,
  });
  drawAcceptance(doc, t, ny + 4);

  drawFooters(doc, t, org, org?.settings?.quoteFooter);
  return doc;
}
