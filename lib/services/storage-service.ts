import { MangaProject } from "@/lib/types";

const API_BASE_URL = '/api/projects';
const IMAGES_API_URL = '/api/images';

// Helper function to extract images from project and return project with IDs
function extractImagesFromProject(project: MangaProject): {
  projectWithoutImages: MangaProject;
  imagesToUpload: Array<{ id: string; imageData: string }>;
} {
  const imagesToUpload: Array<{ id: string; imageData: string }> = [];
  const projectWithoutImages = JSON.parse(JSON.stringify(project)) as MangaProject;

  // Extract images from pages
  if (project.pages) {
    projectWithoutImages.pages = project.pages.map((page: any) => {
      if (page.url && page.url.startsWith('data:image')) {
        const imageId = `page_${page.id}`;
        imagesToUpload.push({ id: imageId, imageData: page.url });
        return { ...page, url: imageId };
      }
      return page;
    });
  }

  // Extract images from sessions
  if (project.sessions) {
    projectWithoutImages.sessions = project.sessions.map((session: any) => {
      const sessionCopy = { ...session };
      
      // Extract from pages
      if (session.pages) {
        sessionCopy.pages = session.pages.map((page: any) => {
          if (page.url && page.url.startsWith('data:image')) {
            const imageId = `page_${page.id}`;
            imagesToUpload.push({ id: imageId, imageData: page.url });
            return { ...page, url: imageId };
          }
          return page;
        });
      }

      // Extract from chatHistory
      if (session.chatHistory) {
        sessionCopy.chatHistory = session.chatHistory.map((msg: any) => {
          if (msg.imageUrl && msg.imageUrl.startsWith('data:image')) {
            const imageId = `chat_${msg.id}`;
            imagesToUpload.push({ id: imageId, imageData: msg.imageUrl });
            return { ...msg, imageUrl: imageId };
          }
          return msg;
        });
      }

      // Extract reference images from config in pages
      if (session.pages) {
        sessionCopy.pages = sessionCopy.pages.map((page: any) => {
          if (page.config && page.config.referenceImages) {
            const refImages = page.config.referenceImages.map((refImg: any, idx: number) => {
              const imgUrl = typeof refImg === 'string' ? refImg : refImg.url;
              if (imgUrl && imgUrl.startsWith('data:image')) {
                const imageId = `ref_${page.id}_${idx}`;
                imagesToUpload.push({ id: imageId, imageData: imgUrl });
                if (typeof refImg === 'string') {
                  return imageId;
                } else {
                  return { ...refImg, url: imageId };
                }
              }
              return refImg;
            });
            page.config.referenceImages = refImages;
          }
          return page;
        });
      }

      return sessionCopy;
    });
  }

  return { projectWithoutImages, imagesToUpload };
}

export const saveProject = async (project: MangaProject): Promise<void> => {
  try {
    // Step 1: Extract images from project
    const { projectWithoutImages, imagesToUpload } = extractImagesFromProject(project);

    // Step 2: Upload images separately if any (in batches to avoid size limits)
    if (imagesToUpload.length > 0) {
      try {
        // Upload in batches of 10 to avoid hitting size limits
        const batchSize = 10;
        for (let i = 0; i < imagesToUpload.length; i += batchSize) {
          const batch = imagesToUpload.slice(i, i + batchSize);
          const imagesResponse = await fetch(IMAGES_API_URL, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ images: batch }),
          });

          if (!imagesResponse.ok) {
            const error = await imagesResponse.json().catch(() => ({ error: 'Failed to save images' }));
            console.warn(`Failed to save image batch ${i / batchSize + 1}:`, error);
            // Continue with project save even if some images fail
          }
        }
      } catch (imgError) {
        console.warn('Error uploading images separately:', imgError);
        // Continue with project save even if images fail
      }
    }

    // Step 3: Save project without images (much smaller payload)
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectWithoutImages),
    });

    if (!response.ok) {
      // Handle 413 specifically
      if (response.status === 413) {
        throw new Error('Project is too large to save. Please try removing some pages or images.');
      }
      
      let errorMessage = 'Failed to save project';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If response is not JSON (like 413), use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('Error saving project to MongoDB:', error);
    
    // Provide more helpful error messages
    if (error.message?.includes('413') || error.message?.includes('Content Too Large')) {
      throw new Error('Project is too large to save. Please try removing some pages or images.');
    }
    
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
