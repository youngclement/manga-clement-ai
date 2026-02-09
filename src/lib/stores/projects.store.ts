import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { projectsService, Project, CreateProjectData, UpdateProjectData } from '../api/projects';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  filters: {
    search: string;
    status: string;
    sort: string;
  };

  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<ProjectsState['pagination']>) => void;
  setFilters: (filters: Partial<ProjectsState['filters']>) => void;

  fetchProjects: (params?: any) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project>;

  updateCurrentProject: (updates: Partial<Project>) => void;
  addPage: () => void;
  updatePage: (pageId: string, updates: any) => void;
  deletePage: (pageId: string) => void;
  addPanel: (pageId: string, panel: any) => void;
  updatePanel: (pageId: string, panelId: string, updates: any) => void;
  deletePanel: (pageId: string, panelId: string) => void;

  invalidateProjects: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    search: '',
    status: '',
    sort: '-createdAt',
  },
};

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setProjects: (projects) => set({ projects }),
        setCurrentProject: (project) => set({ currentProject: project }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setPagination: (pagination) =>
          set((state) => ({
            pagination: { ...state.pagination, ...pagination }
          })),
        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters }
          })),

        fetchProjects: async (params = {}) => {
          set({ isLoading: true, error: null });
          try {
            const state = get();
            const requestParams = {
              ...state.filters,
              ...state.pagination,
              ...params,
            };

            const response = await projectsService.getProjects(requestParams);

            if (response.success && response.data) {
              set({
                projects: response.data,
                pagination: response.meta?.pagination || state.pagination,
              });
            }
          } catch (error) {
            set({ error: (error as Error).message });
          } finally {
            set({ isLoading: false });
          }
        },

        fetchProject: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await projectsService.getProject(id);
            if (response.success && response.data) {
              set({ currentProject: response.data });
            }
          } catch (error) {
            set({ error: (error as Error).message });
          } finally {
            set({ isLoading: false });
          }
        },

        createProject: async (data: CreateProjectData) => {
          set({ isLoading: true, error: null });
          try {
            const response = await projectsService.createProject(data);
            if (response.success && response.data) {
              set((state) => ({
                projects: [response.data!, ...state.projects],
                currentProject: response.data!,
              }));
              return response.data;
            }
            throw new Error('Failed to create project');
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        updateProject: async (id: string, data: UpdateProjectData) => {
          set({ isLoading: true, error: null });
          try {
            const response = await projectsService.updateProject(id, data);
            if (response.success && response.data) {
              set((state) => ({
                projects: state.projects.map(p =>
                  p.id === id ? response.data! : p
                ),
                currentProject: state.currentProject?.id === id
                  ? response.data!
                  : state.currentProject,
              }));
            }
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        deleteProject: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            await projectsService.deleteProject(id);
            set((state) => ({
              projects: state.projects.filter(p => p.id !== id),
              currentProject: state.currentProject?.id === id
                ? null
                : state.currentProject,
            }));
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        duplicateProject: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await projectsService.duplicateProject(id);
            if (response.success && response.data) {
              set((state) => ({
                projects: [response.data!, ...state.projects],
              }));
              return response.data;
            }
            throw new Error('Failed to duplicate project');
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        updateCurrentProject: (updates) => {
          set((state) => ({
            currentProject: state.currentProject
              ? { ...state.currentProject, ...updates }
              : null
          }));
        },

        addPage: () => {
          set((state) => {
            if (!state.currentProject) return state;

            const newPageNumber = state.currentProject.pages.length + 1;
            const newPage = {
              id: `page-${Date.now()}`,
              pageNumber: newPageNumber,
              panels: [],
              layout: 'default',
            };

            return {
              currentProject: {
                ...state.currentProject,
                pages: [...state.currentProject.pages, newPage],
              }
            };
          });
        },

        updatePage: (pageId, updates) => {
          set((state) => {
            if (!state.currentProject) return state;

            return {
              currentProject: {
                ...state.currentProject,
                pages: state.currentProject.pages.map(page =>
                  page.id === pageId ? { ...page, ...updates } : page
                ),
              }
            };
          });
        },

        deletePage: (pageId) => {
          set((state) => {
            if (!state.currentProject) return state;

            return {
              currentProject: {
                ...state.currentProject,
                pages: state.currentProject.pages.filter(page => page.id !== pageId),
              }
            };
          });
        },

        addPanel: (pageId, panel) => {
          set((state) => {
            if (!state.currentProject) return state;

            const newPanel = {
              ...panel,
              id: `panel-${Date.now()}`,
            };

            return {
              currentProject: {
                ...state.currentProject,
                pages: state.currentProject.pages.map(page =>
                  page.id === pageId
                    ? { ...page, panels: [...page.panels, newPanel] }
                    : page
                ),
              }
            };
          });
        },

        updatePanel: (pageId, panelId, updates) => {
          set((state) => {
            if (!state.currentProject) return state;

            return {
              currentProject: {
                ...state.currentProject,
                pages: state.currentProject.pages.map(page =>
                  page.id === pageId
                    ? {
                        ...page,
                        panels: page.panels.map(panel =>
                          panel.id === panelId ? { ...panel, ...updates } : panel
                        ),
                      }
                    : page
                ),
              }
            };
          });
        },

        deletePanel: (pageId, panelId) => {
          set((state) => {
            if (!state.currentProject) return state;

            return {
              currentProject: {
                ...state.currentProject,
                pages: state.currentProject.pages.map(page =>
                  page.id === pageId
                    ? {
                        ...page,
                        panels: page.panels.filter(panel => panel.id !== panelId),
                      }
                    : page
                ),
              }
            };
          });
        },

        invalidateProjects: () => {
          set({ projects: [] });
        },

        clearError: () => set({ error: null }),

        reset: () => set(initialState),
      }),
      {
        name: 'projects-store',
        partialize: (state) => ({
          filters: state.filters,
          currentProject: state.currentProject,
        }),
      }
    ),
    { name: 'ProjectsStore' }
  )
);
