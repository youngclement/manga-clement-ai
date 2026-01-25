import { MangaProject } from "@/lib/types";

const API_BASE_URL = '/api/projects';

export const saveProject = async (project: MangaProject): Promise<void> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save project');
    }
  } catch (error) {
    console.error('Error saving project to MongoDB:', error);
    throw error;
  }
};

export const loadProject = async (id: string = 'default'): Promise<MangaProject | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load project');
    }

    const data = await response.json();
    return data.project || null;
  } catch (error) {
    console.error('Error loading project from MongoDB:', error);
    throw error;
  }
};

export const deleteProject = async (id: string = 'default'): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
  } catch (error) {
    console.error('Error deleting project from MongoDB:', error);
    throw error;
  }
};

// Delete image(s) from MongoDB
export const deleteImage = async (imageId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/images?id=${encodeURIComponent(imageId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete image');
    }
  } catch (error) {
    console.error('Error deleting image from MongoDB:', error);
    throw error;
  }
};

// Delete multiple images from MongoDB
export const deleteImages = async (imageIds: string[]): Promise<void> => {
  try {
    if (imageIds.length === 0) return;
    
    const response = await fetch(`/api/images?ids=${encodeURIComponent(imageIds.join(','))}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete images');
    }
  } catch (error) {
    console.error('Error deleting images from MongoDB:', error);
    throw error;
  }
};
