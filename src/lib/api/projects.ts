import { apiClient, ApiResponse } from './client';
import { API_ENDPOINTS } from './config';

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  coverImage?: string;
  thumbnailUrl?: string;
  tags: string[];
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  settings: {
    style: 'anime' | 'realistic' | 'cartoon' | 'manga' | 'webcomic';
    genre: string;
    colorScheme: 'color' | 'blackwhite' | 'sepia';
    language: string;
    aspectRatio: '16:9' | '4:3' | '1:1' | 'custom';
    resolution: 'low' | 'medium' | 'high' | 'ultra';
  };
  pages: ProjectPage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPage {
  id: string;
  pageNumber: number;
  panels: Panel[];
  layout: string;
  background?: string;
}

export interface Panel {
  id: string;
  position: number;
  prompt: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  text?: string;
  style?: {
    layout: 'single' | 'double' | 'triple' | 'quad';
    size: 'small' | 'medium' | 'large' | 'full';
    border: boolean;
    background?: string;
  };
}

export interface CreateProjectData {
  title: string;
  description?: string;
  settings: Project['settings'];
  tags?: string[];
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: Project['status'];
  isPublic?: boolean;
  pages?: ProjectPage[];
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  filter?: string;
  status?: Project['status'];
}

export class ProjectsService {
  // Get projects list with pagination
  async getProjects(params: ProjectListParams = {}): Promise<ApiResponse<Project[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.PROJECTS.LIST}?${queryString}` : API_ENDPOINTS.PROJECTS.LIST;
    
    return apiClient.get<Project[]>(endpoint);
  }

  // Get single project
  async getProject(id: string, loadImages: boolean = true): Promise<ApiResponse<Project>> {
    const params = new URLSearchParams();
    if (!loadImages) params.append('loadImages', 'false');
    
    const queryString = params.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.PROJECTS.GET(id)}?${queryString}` : API_ENDPOINTS.PROJECTS.GET(id);
    
    return apiClient.get<Project>(endpoint);
  }

  // Create new project
  async createProject(data: CreateProjectData): Promise<ApiResponse<Project>> {
    return apiClient.post<Project>(API_ENDPOINTS.PROJECTS.CREATE, data);
  }

  // Update project
  async updateProject(id: string, data: UpdateProjectData): Promise<ApiResponse<Project>> {
    return apiClient.put<Project>(API_ENDPOINTS.PROJECTS.UPDATE(id), data);
  }

  // Delete project
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.PROJECTS.DELETE(id));
  }

  // Duplicate project
  async duplicateProject(id: string): Promise<ApiResponse<Project>> {
    return apiClient.post<Project>(API_ENDPOINTS.PROJECTS.DUPLICATE(id));
  }

  // Update project page
  async updatePage(projectId: string, pageId: string, pageData: Partial<ProjectPage>): Promise<ApiResponse<Project>> {
    return apiClient.put<Project>(`/projects/${projectId}/pages/${pageId}`, pageData);
  }

  // Add panel to page
  async addPanel(projectId: string, pageId: string, panel: Omit<Panel, 'id'>): Promise<ApiResponse<Project>> {
    return apiClient.post<Project>(`/projects/${projectId}/pages/${pageId}/panels`, panel);
  }

  // Update panel
  async updatePanel(projectId: string, pageId: string, panelId: string, panelData: Partial<Panel>): Promise<ApiResponse<Project>> {
    return apiClient.put<Project>(`/projects/${projectId}/pages/${pageId}/panels/${panelId}`, panelData);
  }

  // Delete panel
  async deletePanel(projectId: string, pageId: string, panelId: string): Promise<ApiResponse<Project>> {
    return apiClient.delete<Project>(`/projects/${projectId}/pages/${pageId}/panels/${panelId}`);
  }

  // Get featured projects (public)
  async getFeaturedProjects(): Promise<ApiResponse<Project[]>> {
    return apiClient.get<Project[]>('/projects/featured', { skipAuth: true });
  }

  // Search public projects
  async searchPublicProjects(params: {
    search?: string;
    tags?: string[];
    style?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Project[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/projects/public${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<Project[]>(endpoint, { skipAuth: true });
  }
}

export const projectsService = new ProjectsService();