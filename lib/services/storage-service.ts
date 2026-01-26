import { MangaProject } from "@/lib/types";
import { handleApiError, safeAsync, extractErrorMessage } from "@/lib/utils/error-handler";

const API_BASE_URL = '/api/projects';

/**
 * Save project to backend
 */
export const saveProject = async (project: MangaProject): Promise<void> => {
  const response = await fetch(API_BASE_URL, {
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

/**
 * Load project from backend
 */
export const loadProject = async (id: string = 'default'): Promise<MangaProject | null> => {
  return safeAsync(async () => {
    const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    return data.project || null;
  }, null) as Promise<MangaProject | null>;
};

/**
 * Delete project from backend
 */
export const deleteProject = async (id: string = 'default'): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

/**
 * Delete single image from backend
 */
export const deleteImage = async (imageId: string): Promise<void> => {
  if (!imageId) return;
  
  const response = await fetch(`/api/images?id=${encodeURIComponent(imageId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

/**
 * Delete multiple images from backend
 */
export const deleteImages = async (imageIds: string[]): Promise<void> => {
  if (!imageIds || imageIds.length === 0) return;
  
  const response = await fetch(`/api/images?ids=${encodeURIComponent(imageIds.join(','))}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};
