import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type LoadingKeys = 
  | 'app-init'
  | 'page-load'
  | 'auth-check'
  | 'projects-fetch'
  | 'project-save'
  | 'project-delete'
  | 'generation'
  | 'batch-generation'
  | 'image-upload'
  | 'profile-update'
  | 'settings-save';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

interface Modal {
  id: string;
  component: string;
  props?: any;
  onClose?: () => void;
}

interface UIState {
  // Loading states
  loadingStates: Record<LoadingKeys, boolean>;
  globalLoading: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Modals
  modals: Modal[];
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Mobile
  isMobile: boolean;
  
  // Page states
  pageTitle: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  
  // Actions
  setLoading: (key: LoadingKeys, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Modals
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Theme
  setTheme: (theme: UIState['theme']) => void;
  toggleTheme: () => void;
  
  // Sidebar
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  // Mobile
  setIsMobile: (isMobile: boolean) => void;
  
  // Page
  setPageTitle: (title: string) => void;
  setBreadcrumbs: (breadcrumbs: UIState['breadcrumbs']) => void;
  
  // Utility
  showSuccessNotification: (title: string, message?: string) => void;
  showErrorNotification: (title: string, message?: string) => void;
  showWarningNotification: (title: string, message?: string) => void;
  showInfoNotification: (title: string, message?: string) => void;
}

const initialState = {
  loadingStates: {} as Record<LoadingKeys, boolean>,
  globalLoading: false,
  notifications: [],
  modals: [],
  theme: 'system' as const,
  sidebarOpen: true,
  sidebarCollapsed: false,
  isMobile: false,
  pageTitle: '',
  breadcrumbs: [],
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Loading management
        setLoading: (key, loading) =>
          set((state) => ({
            loadingStates: { ...state.loadingStates, [key]: loading }
          })),

        setGlobalLoading: (globalLoading) => set({ globalLoading }),

        // Notifications
        addNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random()}`;
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
            duration: notification.duration ?? 5000,
          };

          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }));

          // Auto remove after duration
          if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, newNotification.duration);
          }
        },

        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          })),

        clearNotifications: () => set({ notifications: [] }),

        // Modals
        openModal: (modal) => {
          const id = `modal-${Date.now()}-${Math.random()}`;
          const newModal: Modal = { ...modal, id };

          set((state) => ({
            modals: [...state.modals, newModal]
          }));

          return id;
        },

        closeModal: (id) =>
          set((state) => {
            const modal = state.modals.find(m => m.id === id);
            if (modal?.onClose) {
              modal.onClose();
            }
            return {
              modals: state.modals.filter(m => m.id !== id)
            };
          }),

        closeAllModals: () => {
          const { modals } = get();
          modals.forEach(modal => {
            if (modal.onClose) {
              modal.onClose();
            }
          });
          set({ modals: [] });
        },

        // Theme
        setTheme: (theme) => {
          set({ theme });
          
          // Apply theme to document
          if (typeof window !== 'undefined') {
            const root = document.documentElement;
            
            if (theme === 'system') {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              root.classList.toggle('dark', prefersDark);
            } else {
              root.classList.toggle('dark', theme === 'dark');
            }
          }
        },

        toggleTheme: () => {
          const { theme } = get();
          const newTheme = theme === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },

        // Sidebar
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        // Mobile
        setIsMobile: (isMobile) => set({ isMobile }),

        // Page
        setPageTitle: (pageTitle) => {
          set({ pageTitle });
          if (typeof window !== 'undefined') {
            document.title = pageTitle ? `${pageTitle} - Manga Generator` : 'Manga Generator';
          }
        },

        setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

        // Utility notification helpers
        showSuccessNotification: (title, message = '') =>
          get().addNotification({ type: 'success', title, message }),

        showErrorNotification: (title, message = '') =>
          get().addNotification({ type: 'error', title, message, duration: 8000 }),

        showWarningNotification: (title, message = '') =>
          get().addNotification({ type: 'warning', title, message }),

        showInfoNotification: (title, message = '') =>
          get().addNotification({ type: 'info', title, message }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Hook to check if any loading is active
export const useIsLoading = (keys?: LoadingKeys[]): boolean => {
  return useUIStore((state) => {
    if (!keys) {
      return state.globalLoading || Object.values(state.loadingStates).some(Boolean);
    }
    return keys.some(key => state.loadingStates[key]);
  });
};