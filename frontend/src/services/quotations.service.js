import api from './api.js';

export async function listQuotations({ status = '', clientId = '', page = 1, pageSize = 10 } = {}) {
  const { data } = await api.get('/quotations', {
    params: { status: status || undefined, clientId: clientId || undefined, page, pageSize },
  });
  return data;
}

export const getQuotation = async (id) => (await api.get(`/quotations/${id}`)).data;
export const createQuotation = async (payload) => (await api.post('/quotations', payload)).data;
export const updateQuotation = async (id, payload) =>
  (await api.put(`/quotations/${id}`, payload)).data;
export const setQuotationStatus = async (id, status) =>
  (await api.patch(`/quotations/${id}/status`, { status })).data;
export const convertQuotation = async (id) => (await api.post(`/quotations/${id}/convert`)).data;
export const deleteQuotation = async (id) => (await api.delete(`/quotations/${id}`)).data;
