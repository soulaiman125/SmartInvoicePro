import api from './api.js';

// Maps UI params to the backend query string and returns the paged payload.
export async function listClients({ search = '', page = 1, pageSize = 10 } = {}) {
  const { data } = await api.get('/clients', {
    params: { search: search || undefined, page, pageSize },
  });
  return data; // { data, page, pageSize, total, totalPages }
}

export async function getClient(id) {
  const { data } = await api.get(`/clients/${id}`);
  return data;
}

export async function createClient(payload) {
  const { data } = await api.post('/clients', payload);
  return data;
}

export async function updateClient(id, payload) {
  const { data } = await api.put(`/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id) {
  const { data } = await api.delete(`/clients/${id}`);
  return data; // null (hard delete) or { archived: true, client }
}
