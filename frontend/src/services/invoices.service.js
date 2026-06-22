import api from './api.js';

export async function listInvoices({ status = '', clientId = '', page = 1, pageSize = 10 } = {}) {
  const { data } = await api.get('/invoices', {
    params: { status: status || undefined, clientId: clientId || undefined, page, pageSize },
  });
  return data;
}

export const getInvoice = async (id) => (await api.get(`/invoices/${id}`)).data;
export const createInvoice = async (payload) => (await api.post('/invoices', payload)).data;
export const updateInvoice = async (id, payload) =>
  (await api.put(`/invoices/${id}`, payload)).data;
export const issueInvoice = async (id) => (await api.post(`/invoices/${id}/issue`)).data;
export const cancelInvoice = async (id, reason) =>
  (await api.post(`/invoices/${id}/cancel`, { reason })).data;
export const deleteInvoice = async (id) => (await api.delete(`/invoices/${id}`)).data;
