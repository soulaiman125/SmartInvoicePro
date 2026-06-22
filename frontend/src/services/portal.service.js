import axios from 'axios';
import api from './api.js';

// Bare client (no auth interceptors) — the portal is authorised by the token
// in the URL, not by a logged-in session.
const API = import.meta.env.VITE_API_URL || '/api/v1';
const bare = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

export const getPortal = async (token) => (await bare.get(`/portal/${token}`)).data;

export const portalPdfUrl = (token, kind, id) => `${API}/portal/${token}/${kind}/${id}/pdf`;

// ── Authenticated link management ────────────────────────────────────────────
export const listPortalLinks = async (clientId) =>
  (await api.get(`/clients/${clientId}/portal-links`)).data;
export const createPortalLink = async (clientId) =>
  (await api.post(`/clients/${clientId}/portal-links`)).data;
export const revokePortalLink = async (clientId, linkId) =>
  (await api.delete(`/clients/${clientId}/portal-links/${linkId}`)).data;
