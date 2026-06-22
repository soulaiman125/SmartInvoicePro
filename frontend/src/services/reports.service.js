import api from './api.js';
import { downloadFile } from '../utils/download.js';

export const getReportCatalog = async () => (await api.get('/reports')).data;

export const getReport = async (key, params = {}) =>
  (await api.get(`/reports/${key}`, { params })).data;

// Triggers a file download for a report in the given format (csv | xlsx | pdf).
export async function exportReport(key, format, params = {}) {
  const search = new URLSearchParams({ format, ...params }).toString();
  const ext = format === 'xlsx' ? 'xlsx' : format;
  const date = new Date().toISOString().slice(0, 10);
  await downloadFile(`/reports/${key}?${search}`, `${key}-report-${date}.${ext}`);
}
