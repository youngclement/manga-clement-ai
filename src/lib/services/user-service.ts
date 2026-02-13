import { apiFetch } from '@/lib/services/api-client';
import { handleApiError, safeAsync } from '@/lib/utils/error-handler';
import type { UserProfile } from '@/lib/types';

export const getMyProfile = async (): Promise<UserProfile | null> => {
  return safeAsync(async () => {
    const res = await apiFetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const profile = data?.data?.profile ?? data?.data ?? data?.profile ?? null;
    return profile as UserProfile | null;
  }, null) as Promise<UserProfile | null>;
};

export const updateMyProfile = async (
  payload: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      instagram?: string;
      facebook?: string;
      youtube?: string;
      tiktok?: string;
    };
    preferences?: {
      theme?: 'light' | 'dark' | 'auto';
      language?: string;
      notifications?: {
        email?: boolean;
        push?: boolean;
        comments?: boolean;
        likes?: boolean;
      };
    };
  }
): Promise<UserProfile | null> => {
  return safeAsync(async () => {
    const res = await apiFetch('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const profile = data?.data?.profile ?? data?.data ?? data?.profile ?? null;
    return profile as UserProfile | null;
  }, null) as Promise<UserProfile | null>;
};

export const uploadAvatar = async (imageData: string): Promise<string> => {
  return safeAsync(async () => {
    const res = await apiFetch('/api/users/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const avatarUrl = data?.data?.avatarUrl ?? data?.avatarUrl ?? null;
    if (!avatarUrl) {
      throw new Error('Failed to upload avatar');
    }
    return avatarUrl as string;
  }, '') as Promise<string>;
};
