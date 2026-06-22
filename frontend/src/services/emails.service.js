import api from './api.js';

export async function listEmails({ entityType, entityId, status, page = 1, pageSize = 20 } = {}) {
  const { data } = await api.get('/emails', {
    params: {
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      status: status || undefined,
      page,
      pageSize,
    },
  });
  return data;
}

export const retryEmail = async (id) => (await api.post(`/emails/${id}/retry`)).data;
export const sendInvoiceEmail = async (id, to) => (await api.post(`/invoices/${id}/email`, { to })).data;
export const sendInvoiceReminder = async (id, to) => (await api.post(`/invoices/${id}/reminder`, { to })).data;
export const sendQuoteEmail = async (id, to) => (await api.post(`/quotations/${id}/email`, { to })).data;
