import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// Renders a normalized report object (see report.service.js) to CSV / XLSX / PDF.

const major = (minor) => Number(minor || 0) / 100;

const money = (minor, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(major(minor));
  } catch {
    return `${currency} ${major(minor).toFixed(2)}`;
  }
};

const isoDate = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');
const niceDate = (v) => (v ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '');

// Plain cell value for CSV (money as decimal number, dates as ISO).
function csvCell(col, value) {
  if (value == null || value === '') return '';
  if (col.type === 'money') return major(value).toFixed(2);
  if (col.type === 'date') return isoDate(value);
  return String(value);
}

export function toCsv(report) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = report.columns.map((c) => esc(c.label)).join(',');
  const rows = [...report.rows, ...(report.summary || [])].map((r) =>
    report.columns.map((c) => esc(csvCell(c, r[c.key]))).join(','),
  );
  return [header, ...rows].join('\n');
}

export async function toXlsx(report) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SmartInvoice Pro';
  wb.created = new Date();
  const ws = wb.addWorksheet(report.title.slice(0, 31));

  ws.columns = report.columns.map((c) => ({
    header: c.label,
    key: c.key,
    width: Math.max(12, c.label.length + 4),
  }));

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  head.alignment = { vertical: 'middle' };

  const addStyled = (record, bold) => {
    const data = {};
    for (const c of report.columns) {
      const v = record[c.key];
      if (c.type === 'money') data[c.key] = major(v);
      else if (c.type === 'date') data[c.key] = v ? new Date(v) : null;
      else data[c.key] = v;
    }
    const row = ws.addRow(data);
    if (bold) row.font = { bold: true };
    report.columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      if (c.type === 'money') cell.numFmt = '#,##0.00';
      if (c.type === 'date') cell.numFmt = 'yyyy-mm-dd';
      if (c.type === 'money' || c.type === 'number') cell.alignment = { horizontal: 'right' };
    });
  };

  report.rows.forEach((r) => addStyled(r, false));
  (report.summary || []).forEach((r) => addStyled(r, true));
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  return wb.xlsx.writeBuffer();
}

export function toPdf(report, org) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40, bufferPages: true });
  const PAGE_W = 841.89;
  const left = 40;
  const right = PAGE_W - 40;
  const width = right - left;
  const BOTTOM = 525;

  // Header
  doc.fillColor('#4F46E5').font('Helvetica-Bold').fontSize(18).text(org?.name || 'SmartInvoice Pro', left, 38);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(15).text(report.title, left, 60);
  let sub = `Generated ${new Date().toLocaleString('en-US')}`;
  if (report.meta?.from) {
    sub += `  ·  ${niceDate(report.meta.from)} – ${niceDate(report.meta.to)}`;
  }
  doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(sub, left, 82);

  // Column geometry
  const weights = report.columns.map((c) => (c.type === 'text' ? 2 : 1.1));
  const totalW = weights.reduce((a, b) => a + b, 0);
  const colW = weights.map((w) => (width * w) / totalW);
  const colX = [];
  let cx = left;
  report.columns.forEach((_, i) => {
    colX[i] = cx;
    cx += colW[i];
  });
  const align = (c) => (c.type === 'money' || c.type === 'number' ? 'right' : 'left');
  const cell = (c, v) => {
    if (v == null || v === '') return '';
    if (c.type === 'money') return money(v, report.currency);
    if (c.type === 'date') return niceDate(v);
    return String(v);
  };

  const drawHeader = (yy) => {
    doc.rect(left, yy, width, 20).fill('#EEF0FE');
    doc.fillColor('#4F46E5').font('Helvetica-Bold').fontSize(8.5);
    report.columns.forEach((c, i) => {
      doc.text(c.label.toUpperCase(), colX[i] + 4, yy + 6, { width: colW[i] - 8, align: align(c) });
    });
    return yy + 24;
  };

  let y = drawHeader(104);
  const drawRow = (r, bold, i) => {
    if (y > BOTTOM) {
      doc.addPage();
      y = drawHeader(40);
    }
    if (!bold && i % 2 === 1) doc.rect(left, y - 2, width, 16).fill('#F8FAFC');
    doc.fillColor('#0f172a').font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
    report.columns.forEach((c, ci) => {
      doc.text(cell(c, r[c.key]), colX[ci] + 4, y + 2, { width: colW[ci] - 8, align: align(c), lineBreak: false });
    });
    y += 16;
    doc.moveTo(left, y - 2).lineTo(right, y - 2).lineWidth(0.4).strokeColor('#e2e8f0').stroke();
  };

  report.rows.forEach((r, i) => drawRow(r, false, i));
  (report.summary || []).forEach((r) => drawRow(r, true, -1));

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
      .text(`Generated by SmartInvoice Pro · Page ${i + 1} of ${range.count}`, left, 560, { width, align: 'center' });
  }
  return doc;
}
