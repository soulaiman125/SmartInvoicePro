import api from './api.js';

export async function listRecurring({ status = '', page = 1, pageSize = 20 } = {}) {
  const { data } = await api.get('/recurring-invoices', {
    params: { status: status || undefined, page, pageSize },
  });
  return data;
}

export const getRecurring = async (id) => (await api.get(`/recurring-invoices/${id}`)).data;
export const createRecurring = async (payload) => (await api.post('/recurring-invoices', payload)).data;
export const updateRecurring = async (id, payload) => (await api.put(`/recurring-invoices/${id}`, payload)).data;
export const pauseRecurring = async (id) => (await api.post(`/recurring-invoices/${id}/pause`)).data;
export const resumeRecurring = async (id) => (await api.post(`/recurring-invoices/${id}/resume`)).data;
export const deleteRecurring = async (id) => (await api.delete(`/recurring-invoices/${id}`)).data;
export const runRecurring = async () => (await api.post('/recurring-invoices/run')).data;
