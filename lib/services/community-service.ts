import { apiFetch } from '@/lib/services/api-client';
import { handleApiError, safeAsync } from '@/lib/utils/error-handler';
import type { MangaProject, ProjectComment } from '@/lib/types';

export interface LikeStatus {
  total: number;
  likedByUser: boolean;
}

export const fetchPublicProjectDetail = async (
  ownerId: string,
  projectId: string
): Promise<MangaProject | null> => {
  return safeAsync(async () => {
    const res = await apiFetch(
      `/api/projects/public/${encodeURIComponent(ownerId)}/${encodeURIComponent(projectId)}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    );

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const project = data?.data?.project ?? data?.project ?? null;
    return project as MangaProject | null;
  }, null) as Promise<MangaProject | null>;
};

export const fetchLikes = async (
  ownerId: string,
  projectId: string
): Promise<LikeStatus> => {
  return safeAsync(async () => {
    const res = await apiFetch(
      `/api/projects/public/${encodeURIComponent(ownerId)}/${encodeURIComponent(projectId)}/likes`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    );

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const likes = data?.data?.likes ?? data?.likes ?? { total: 0, likedByUser: false };
    return likes as LikeStatus;
  }, { total: 0, likedByUser: false }) as Promise<LikeStatus>;
};

export const toggleLike = async (
  ownerId: string,
  projectId: string
): Promise<LikeStatus> => {
  return safeAsync(async () => {
    const res = await apiFetch(
      `/api/projects/public/${encodeURIComponent(ownerId)}/${encodeURIComponent(projectId)}/likes`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    );

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const likes = data?.data?.likes ?? data?.likes ?? { total: 0, likedByUser: false };
    return likes as LikeStatus;
  }, { total: 0, likedByUser: false }) as Promise<LikeStatus>;
};

export const fetchComments = async (
  ownerId: string,
  projectId: string
): Promise<ProjectComment[]> => {
  return safeAsync(async () => {
    const res = await apiFetch(
      `/api/projects/public/${encodeURIComponent(ownerId)}/${encodeURIComponent(projectId)}/comments`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    );

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const comments = data?.data?.comments ?? data?.comments ?? [];
    return comments as ProjectComment[];
  }, []) as Promise<ProjectComment[]>;
};

export const addComment = async (
  ownerId: string,
  projectId: string,
  text: string,
  parentId?: string | null
): Promise<ProjectComment | null> => {
  return safeAsync(async () => {
    const res = await apiFetch(
      `/api/projects/public/${encodeURIComponent(ownerId)}/${encodeURIComponent(projectId)}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, parentId }),
      },
    );

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const comment = data?.data?.comment ?? data?.comment ?? null;
    return comment as ProjectComment | null;
  }, null) as Promise<ProjectComment | null>;
};


