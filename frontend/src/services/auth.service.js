import api from './api.js';
import { setTokens, clearTokens, getRefreshToken } from './tokenStorage.js';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  setTokens(data);
  return data;
}

export async function register(payload) {
  const { data } = await api.post('/auth/signup', payload);
  setTokens(data);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    await api.post('/auth/logout', { refreshToken });
  } catch {
    // Best-effort; clear local tokens regardless.
  }
  clearTokens();
}

export async function getOrganizations() {
  const { data } = await api.get('/auth/organizations');
  return data;
}

export async function switchOrganization(organizationId) {
  const { data } = await api.post('/auth/switch-organization', { organizationId });
  setTokens(data);
  return data;
}

export async function createOrganization(payload) {
  const { data } = await api.post('/auth/organizations', payload);
  setTokens(data);
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data;
}
