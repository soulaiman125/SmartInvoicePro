import api from './api.js';

export const listMovements = async ({ page = 1, pageSize = 20 } = {}) =>
  (await api.get('/inventory/movements', { params: { page, pageSize } })).data;

export const lowStock = async () => (await api.get('/inventory/low-stock')).data;

export const analytics = async () => (await api.get('/inventory/analytics')).data;

export const adjustStock = async (productId, payload) =>
  (await api.post(`/inventory/products/${productId}/adjust`, payload)).data;
