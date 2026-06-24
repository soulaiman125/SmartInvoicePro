import api from './api.js';

export async function listAuditLogs({ action = '', entityType = '', page = 1, pageSize = 25 } = {}) {
  const { data } = await api.get('/audit-logs', {
    params: { action: action || undefined, entityType: entityType || undefined, page, pageSize },
  });
  return data;
}
