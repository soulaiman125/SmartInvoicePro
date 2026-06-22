import api from './api.js';

export const listNotifications = async ({ page = 1, pageSize = 10, unread } = {}) =>
  (await api.get('/notifications', { params: { page, pageSize, unread } })).data;

export const getUnreadCount = async () => (await api.get('/notifications/unread-count')).data;
export const markRead = async (id) => (await api.patch(`/notifications/${id}/read`)).data;
export const markAllRead = async () => (await api.post('/notifications/read-all')).data;
