import api from './api.js';

export async function listExpenses({ search = '', category = '', from = '', to = '', page = 1, pageSize = 10 } = {}) {
  const { data } = await api.get('/expenses', {
    params: {
      search: search || undefined,
      category: category || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize,
    },
  });
  return data;
}

export const getExpense = async (id) => (await api.get(`/expenses/${id}`)).data;
export const createExpense = async (payload) => (await api.post('/expenses', payload)).data;
export const updateExpense = async (id, payload) => (await api.put(`/expenses/${id}`, payload)).data;
export const deleteExpense = async (id) => (await api.delete(`/expenses/${id}`)).data;
export const getExpenseCategories = async () => (await api.get('/expenses/categories')).data;
export const getExpenseSummary = async (params = {}) => (await api.get('/expenses/summary', { params })).data;
