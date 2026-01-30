import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  error: string | null;
  loadFromStorage: () => void;
  setTokens: (access: string, refresh: string) => void;
  clear: () => void;
  setError: (err: string | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  error: null,
  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    const access = window.localStorage.getItem('accessToken');
    const refresh = window.localStorage.getItem('refreshToken');
    set({
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: !!access,
    });
  },
  setTokens: (access: string, refresh: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('accessToken', access);
      window.localStorage.setItem('refreshToken', refresh);
    }
    set({
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: true,
      error: null,
    });
  },
  clear: () => {
    if (typeof window !== 'undefined') {
      // Remove tokens from localStorage
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('refreshToken');
      // Also clear any other auth-related data if exists
      window.localStorage.removeItem('authError');
    }
    // Reset all auth state
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },
  setError: (err: string | null) => set({ error: err }),
}));

// Non-React wrapper for services
export const authStore = {
  loadFromStorage: () => useAuthStore.getState().loadFromStorage(),
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (access: string, refresh: string) =>
    useAuthStore.getState().setTokens(access, refresh),
  clear: () => useAuthStore.getState().clear(),
  setError: (err: string | null) => useAuthStore.getState().setError(err),
};

