import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/auth.service.js';
import { getAccessToken, clearTokens } from '../services/tokenStorage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore the session from a stored access token.
  useEffect(() => {
    let active = true;
    async function bootstrap() {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authService.fetchMe();
        if (active) setUser(me);
      } catch {
        clearTokens();
      } finally {
        if (active) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    await authService.login(email, password);
    const me = await authService.fetchMe();
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    await authService.register(payload);
    const me = await authService.fetchMe();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // Switch to another organization: re-issues a scoped token, then hard-reloads
  // so every cached query reloads against the new tenant.
  const switchOrg = useCallback(async (organizationId) => {
    await authService.switchOrganization(organizationId);
    window.location.assign('/dashboard');
  }, []);

  const createOrg = useCallback(async (payload) => {
    await authService.createOrganization(payload);
    window.location.assign('/dashboard');
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    switchOrg,
    createOrg,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
