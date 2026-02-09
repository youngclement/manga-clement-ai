import { MangaProject, GeneratedManga, MangaSession } from "@/lib/types";
import { handleApiError, safeAsync } from "@/lib/utils/error-handler";
import { apiFetch } from "@/lib/services/api-client";

const API_BASE_URL = '/api/projects';

export const saveProject = async (project: MangaProject): Promise<void> => {
  const response = await apiFetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const updateProjectMeta = async (
  projectId: string,
  meta: {
    title?: string;
    preferences?: MangaProject['preferences'];
    isPublic?: boolean;
    description?: string;
    coverImageUrl?: string;
    tags?: string[];
  }
): Promise<void> => {
  const response = await apiFetch(`/api/projects/meta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId, ...meta }),
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const fetchMyProjects = async (): Promise<MangaProject[]> => {
  return safeAsync(async () => {
    const response = await apiFetch(`/api/projects/my`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    const projects = data?.data?.projects ?? data?.projects ?? [];
    return projects as MangaProject[];
  }, []) as Promise<MangaProject[]>;
};

export interface FetchPublicProjectsOptions {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'mostLiked' | 'mostViewed' | 'mostCommented' | 'trending';
  tags?: string[];
  ownerId?: string;
}

export interface FetchPublicProjectsResult {
  projects: MangaProject[];
  total: number;
}

export const fetchPublicProjects = async (
  options: FetchPublicProjectsOptions = {}
): Promise<FetchPublicProjectsResult> => {
  const { limit = 50, offset = 0, search, sortBy, tags, ownerId } = options;

  return safeAsync(async () => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (tags && tags.length > 0) params.append('tags', tags.join(','));
    if (ownerId) params.append('ownerId', ownerId);

    const response = await apiFetch(`/api/projects/public?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    const projects = data?.data?.projects ?? data?.projects ?? [];
    const total = data?.data?.total ?? data?.total ?? projects.length;

    return { projects: projects as MangaProject[], total };
  }, { projects: [], total: 0 }) as Promise<FetchPublicProjectsResult>;
};

export const fetchPublicProjectDetail = async (
  ownerId: string,
  projectId: string,
  trackView: boolean = true
): Promise<MangaProject | null> => {
  return safeAsync(async () => {
    const params = new URLSearchParams();
    if (trackView) params.append('trackView', 'true');

    const response = await apiFetch(
      `/api/projects/public/${encodeURIComponent(ownerId)}/${encodeURIComponent(projectId)}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    const project = data?.data?.project ?? data?.project ?? null;
    return project as MangaProject | null;
  }, null) as Promise<MangaProject | null>;
};

export const loadProject = async (id: string = 'default'): Promise<MangaProject | null> => {
  return safeAsync(async () => {
    const response = await apiFetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    const project = data?.data?.project ?? data?.data ?? data?.project ?? null;
    return project as MangaProject | null;
  }, null) as Promise<MangaProject | null>;
};

export const loadProjectImages = async (
  imageIdsOrUrls: string[],
): Promise<Record<string, string | null>> => {
  if (!imageIdsOrUrls || imageIdsOrUrls.length === 0) return {};

  const response = await apiFetch(`/api/projects/images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageIds: imageIdsOrUrls }),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  const data = await response.json();
  const images =
    (data?.data && data.data.images) ||
    data?.images ||
    {};

  return images as Record<string, string | null>;
};

export const deleteProject = async (id: string = 'default'): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const deleteSession = async (projectId: string, sessionId: string): Promise<void> => {
  const url = `/api/projects/sessions?projectId=${encodeURIComponent(projectId)}&sessionId=${encodeURIComponent(sessionId)}`;
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const deletePages = async (projectId: string, pageIds: string[]): Promise<void> => {
  if (!pageIds || pageIds.length === 0) return;

  const url = `/api/projects/pages?projectId=${encodeURIComponent(projectId)}&pageIds=${encodeURIComponent(pageIds.join(','))}`;
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const deleteImage = async (imageId: string): Promise<void> => {
  if (!imageId) return;

  const response = await apiFetch(`/api/images?id=${encodeURIComponent(imageId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const deleteImages = async (imageIds: string[]): Promise<void> => {
  if (!imageIds || imageIds.length === 0) return;

  const response = await apiFetch(`/api/images?ids=${encodeURIComponent(imageIds.join(','))}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const addPageToSession = async (
  projectId: string,
  sessionId: string,
  page: GeneratedManga
): Promise<void> => {
  const response = await apiFetch(`/api/projects/sessions/page`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId, sessionId, page }),
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const markPageForExport = async (
  projectId: string,
  sessionId: string,
  pageId: string,
  marked: boolean
): Promise<void> => {
  const response = await apiFetch(`/api/projects/sessions/page/mark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId, sessionId, pageId, marked }),
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const saveSession = async (
  projectId: string,
  session: MangaSession
): Promise<void> => {
  const response = await apiFetch(`/api/projects/sessions/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId, session }),
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};
