import api from './api.js';

export const listPayments = async ({ status = '', page = 1, pageSize = 10 } = {}) =>
  (await api.get('/payments', { params: { status: status || undefined, page, pageSize } })).data;

export const listInvoicePayments = async (invoiceId) =>
  (await api.get(`/payments/invoice/${invoiceId}`)).data;

export const recordPayment = async (invoiceId, payload) =>
  (await api.post(`/payments/invoice/${invoiceId}`, payload)).data;

export const refundPayment = async (id) => (await api.post(`/payments/${id}/refund`)).data;
