import api from './api.js';

export const getSettings = async () => (await api.get('/settings')).data;
export const updateSettings = async (payload) => (await api.put('/settings', payload)).data;
