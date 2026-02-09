import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient, ApiResponse } from '../api/client';
import { API_ENDPOINTS } from '../api/config';

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  plan: 'free' | 'premium' | 'pro';
  generationCount: number;
  monthlyGenerationLimit: number;
  settings: {
    language: string;
    theme: string;
    notifications: boolean;
  };
  isEmailVerified: boolean;
  createdAt: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  loginLoading: boolean;
  registerLoading: boolean;
  refreshLoading: boolean;
  logoutLoading: boolean;
  profileLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  getProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  loginLoading: false,
  registerLoading: false,
  refreshLoading: false,
  logoutLoading: false,
  profileLoading: false,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        setTokens: (accessToken, refreshToken) => {
          set({ accessToken, refreshToken });
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          }
        },
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        login: async (credentials) => {
          set({ loginLoading: true, error: null });
          try {
            const response = await apiClient.post<{
              user: User;
              accessToken: string;
              refreshToken: string;
            }>(API_ENDPOINTS.AUTH.LOGIN, credentials, { skipAuth: true });

            if (response.success && response.data) {
              const { user, accessToken, refreshToken } = response.data;
              get().setTokens(accessToken, refreshToken);
              set({
                user,
                isAuthenticated: true,
                error: null
              });
            }
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ loginLoading: false });
          }
        },

        register: async (data) => {
          set({ registerLoading: true, error: null });
          try {
            const response = await apiClient.post<{
              user: User;
              accessToken: string;
              refreshToken: string;
            }>(API_ENDPOINTS.AUTH.REGISTER, data, { skipAuth: true });

            if (response.success && response.data) {
              const { user, accessToken, refreshToken } = response.data;
              get().setTokens(accessToken, refreshToken);
              set({
                user,
                isAuthenticated: true,
                error: null
              });
            }
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ registerLoading: false });
          }
        },

        logout: async () => {
          set({ logoutLoading: true });
          try {
            await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
          } catch (error) {
          } finally {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              logoutLoading: false,
              error: null,
            });
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          }
        },

        refreshTokens: async () => {
          const { refreshToken } = get();
          if (!refreshToken) return false;

          set({ refreshLoading: true });
          try {
            const response = await apiClient.post<{
              accessToken: string;
              refreshToken: string;
            }>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }, { skipAuth: true });

            if (response.success && response.data) {
              const { accessToken, refreshToken: newRefreshToken } = response.data;
              get().setTokens(accessToken, newRefreshToken);
              return true;
            }
            return false;
          } catch (error) {
            get().logout();
            return false;
          } finally {
            set({ refreshLoading: false });
          }
        },

        getProfile: async () => {
          set({ profileLoading: true, error: null });
          try {
            const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.PROFILE);
            if (response.success && response.data) {
              set({ user: response.data });
            }
          } catch (error) {
            set({ error: (error as Error).message });
          } finally {
            set({ profileLoading: false });
          }
        },

        updateProfile: async (data) => {
          set({ profileLoading: true, error: null });
          try {
            const response = await apiClient.put<User>(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
            if (response.success && response.data) {
              set({ user: response.data });
            }
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ profileLoading: false });
          }
        },

        checkAuth: async () => {
          const { accessToken, refreshToken } = get();
          set({ isInitializing: true });

          try {
            if (!accessToken && !refreshToken) {
              set({ isInitializing: false });
              return;
            }
            if (accessToken) {
              try {
                await get().getProfile();
                set({ isInitializing: false });
                return;
              } catch (error) {
              }
            }
            if (refreshToken) {
              const success = await get().refreshTokens();
              if (success) {
                await get().getProfile();
              }
            }
          } catch (error) {
            get().logout();
          } finally {
            set({ isInitializing: false });
          }
        },

        clearError: () => set({ error: null }),
        reset: () => set(initialState),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
