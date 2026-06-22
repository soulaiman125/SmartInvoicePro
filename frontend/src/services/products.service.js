import api from './api.js';

export async function listProducts({ search = '', category = '', page = 1, pageSize = 12 } = {}) {
  const { data } = await api.get('/products', {
    params: {
      search: search || undefined,
      category: category || undefined,
      page,
      pageSize,
    },
  });
  return data; // { data, page, pageSize, total, totalPages }
}

export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function listCategories() {
  const { data } = await api.get('/products/categories');
  return data; // string[]
}

export async function createProduct(payload) {
  const { data } = await api.post('/products', payload);
  return data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}
