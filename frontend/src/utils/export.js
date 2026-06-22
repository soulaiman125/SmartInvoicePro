// Client-side exporters with no external dependency.
// CSV opens in Excel/Sheets; the .xls variant is an Excel-readable HTML table.

function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const htmlCell = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Byte-order mark so Excel detects UTF-8 (escape form to satisfy linters).
const BOM = String.fromCharCode(0xfeff);

// columns: [{ header, value(row) }]
export function exportToCsv(filename, columns, rows) {
  const header = columns.map((c) => csvCell(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(',')).join('\n');
  triggerDownload(`${BOM}${header}\n${body}`, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function exportToExcel(filename, columns, rows) {
  const ths = columns.map((c) => `<th>${htmlCell(c.header)}</th>`).join('');
  const trs = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${htmlCell(c.value(r))}</td>`).join('')}</tr>`)
    .join('');
  const html = `<html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></body></html>`;
  triggerDownload(html, `${filename}.xls`, 'application/vnd.ms-excel');
}
