import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage.js';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, try once to rotate the refresh token and replay the request.
let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && !original?._retried && !isAuthCall && getRefreshToken()) {
      original._retried = true;
      try {
        // De-duplicate concurrent refreshes.
        refreshing =
          refreshing ||
          axios.post(`${baseURL}/auth/refresh`, { refreshToken: getRefreshToken() });
        const { data } = await refreshing;
        refreshing = null;
        setTokens(data);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        refreshing = null;
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
