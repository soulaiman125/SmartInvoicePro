import api from './api.js';

export const getDashboard = async () => (await api.get('/analytics/dashboard')).data;
export const getMonthlyRevenue = async (months = 12) =>
  (await api.get('/analytics/revenue/monthly', { params: { months } })).data;
export const getProductPerformance = async (limit = 5) =>
  (await api.get('/analytics/products/performance', { params: { limit } })).data;
export const getClientReport = async () => (await api.get('/analytics/reports/clients')).data;
